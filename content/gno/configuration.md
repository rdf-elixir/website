# Configuration

Gno uses an RDF-based configuration system called manifests. Manifest files are Turtle files that describe your service, repository, and store backend using DCAT-R vocabulary.

## Directory Structure

Manifest files are organized by environment in `config/gno/`:

```
config/gno/
├── dev/
│   ├── service.ttl
│   ├── repository.ttl
│   ├── fuseki.ttl
│   └── user.ttl
└── test/
    ├── service.ttl
    ├── repository.ttl
    └── oxigraph.ttl
```

All Turtle files in the directory for the current environment are loaded and merged. This allows you to split the configuration across multiple files for better organization.

## Manifest Files

### Service

The service file is the central piece of configuration. It links the repository with a store backend:

```turtle
@prefix dcatr: <https://w3id.org/dcatr#> .
@prefix gno: <https://w3id.org/gno#> .
@prefix dcterms: <http://purl.org/dc/terms/> .

<Service> a gno:Service                         # required
    ; dcatr:serviceRepository <Repository>      # required
    ; gno:serviceStore <Fuseki>                 # required
    ; dcterms:title "My service"                # optional
.
```

### Repository

The repository file describes the data catalog. DCAT-R supports two patterns for organizing data graphs within a repository.

#### Single-Graph Repository

For repositories with a single data graph, use the `dcatr:repositoryDataGraph` shortcut. This property combines primary graph designation and containment in one statement:

```turtle
@prefix dcatr: <https://w3id.org/dcatr#> .
@prefix dcterms: <http://purl.org/dc/terms/> .

<Repository> a dcatr:Repository
    ; dcatr:repositoryDataGraph <Graph>                         # required (see below)
    ; dcatr:repositoryManifestGraph <RepositoryManifestGraph>   # required
    ; dcterms:title "My repository"                             # optional
.

<Graph> a dcatr:DataGraph
    ; dcterms:title "My data graph"             # optional
.
```

#### Multi-Graph Repository

For repositories with multiple data graphs, use `dcatr:repositoryDataset` to link to a `dcatr:Dataset` containing multiple `dcatr:DataGraph` entries. You can optionally designate one graph as the primary entry point with `dcatr:repositoryPrimaryGraph`:

```turtle
@prefix dcatr: <https://w3id.org/dcatr#> .
@prefix dcterms: <http://purl.org/dc/terms/> .

<Repository> a dcatr:Repository
    ; dcatr:repositoryDataset <Dataset>                         # required (see below)
    ; dcatr:repositoryPrimaryGraph <People>                     # optional
    ; dcatr:repositoryManifestGraph <RepositoryManifestGraph>   # required
    ; dcterms:title "My repository"                             # optional
.

<Dataset> a dcatr:Dataset
    ; dcatr:dataGraph <People>                  # at least one required
    ; dcatr:dataGraph <Organizations>
    ; dcterms:title "My dataset"                # optional
.

<People> a dcatr:DataGraph
    ; dcterms:title "People graph"              # optional
.

<Organizations> a dcatr:DataGraph
    ; dcterms:title "Organizations graph"       # optional
.
```

A repository must use exactly one of the two patterns: either `dcatr:repositoryDataGraph` (single-graph) or `dcatr:repositoryDataset` (multi-graph).

### Graph IDs and Graph Names

Every graph in DCAT-R has a **graph ID** - its canonical RDF resource URI (e.g. `<http://example.com/Graph>`). By default, this ID is also the name under which the graph is stored in the SPARQL store. However, these two concepts can be separated.

The `dcatr:localGraphName` property allows you to assign a **local graph name** - a service-specific alias under which the graph appears in the store's RDF dataset. This is useful when:

- You want stable local names independent of the canonical graph URI
- You need to import graphs whose canonical URIs would conflict with existing names
- You want short, convenient names for commonly accessed graphs

Local graph names are configured in the service manifest (not the repository manifest), since they are service-specific - different service instances can use different local names for the same graph:

```turtle
@prefix dcatr: <https://w3id.org/dcatr#> .

<Graph> dcatr:localGraphName <http://localhost/graphs/main> .
```

If no local graph name is set, the graph ID is used as the graph name in the store.

### Primary Graph

In many repositories, one data graph serves as the main entry point - the graph that operations target by default when no specific graph is specified. DCAT-R calls this the **primary graph**.

In single-graph repositories, the primary graph is set automatically by `dcatr:repositoryDataGraph`. In multi-graph repositories, you designate it explicitly with `dcatr:repositoryPrimaryGraph`:

```turtle
<Repository> a dcatr:Repository
    ; dcatr:repositoryDataset <Dataset>
    ; dcatr:repositoryPrimaryGraph <People>     # designates People as the primary graph
    ; dcatr:repositoryManifestGraph <RepositoryManifestGraph>
.
```

Note that `dcatr:repositoryPrimaryGraph` is a pure designator - it does not imply containment. The designated graph must also be listed in the dataset's data graphs.

The primary graph is a repository-level concept: it is shared across all service instances that serve the same repository.

### Default Graph

The **default graph** is a different, service-level concept: it refers to the unnamed graph in an [RDF 1.1 dataset](https://www.w3.org/TR/rdf11-concepts/#section-dataset), the graph that SPARQL queries target when no `GRAPH` clause is used.

Since which graph serves as the default graph can vary between service instances, explicit default graph configuration belongs in the service manifest (just like [local graph names](#graph-ids-and-graph-names)), by typing the respective graph as `dcatr:DefaultGraph`:

```turtle
<Graph> a dcatr:DefaultGraph .
```

The `dcatr:usePrimaryAsDefault` property on the service controls how the primary graph relates to the default graph:

- **Absent** (the default): Auto mode - the primary graph automatically becomes the default graph, unless an explicit `dcatr:DefaultGraph` is configured in the service manifest.
- **`true`**: Enforce mode - the primary graph must be the default graph.
- **`false`**: Disable mode - no automatic designation. You must explicitly configure a `dcatr:DefaultGraph` in the service manifest, or no default will be set.

For most use cases, the default auto mode is sufficient: the primary graph serves as the default graph, so queries like `Gno.select("SELECT * WHERE { ?s ?p ?o }")` operate on the primary data graph.

### Graph Selectors

When using the Gno API, you can refer to graphs by symbolic selectors instead of their full IRIs:

- `:default` - the default graph
- `:primary` - the primary data graph
- `:repo_manifest` - the repository manifest graph
- `:union` - the union of all graphs (see next section)

```elixir
{:ok, graph} = Gno.graph(:primary)
:ok = Gno.insert_data(data, graph: :default)
```

These selectors are resolved through the service configuration to the actual graph names in the store.

### Default Graph Semantics

SPARQL stores differ in what they return when querying the default graph (i.e. without a `GRAPH` clause):

- **Isolated**: The default graph contains only its own triples. Named graphs are separate. (Fuseki, Oxigraph)
- **Union**: The default graph returns the union of all triples across all graphs. (QLever, GraphDB)

Gno normalizes this behavior transparently: on stores with union semantics, queries targeting the default graph (`:default` or no `:graph` option) automatically restrict to the real default graph using the SPARQL protocol's `default-graph-uri` parameter.

To explicitly query the union of all graphs on a union store, use the `:union` graph selector:

```elixir
{:ok, result} = Gno.select("SELECT * WHERE { ?s ?p ?o }", graph: :union)
```

For stores with configurable semantics (e.g. Fuseki can be configured for union mode), you can override the adapter's default via the `gno:storeDefaultGraphSemantics` manifest property:

```turtle
<Fuseki> a gnoa:Fuseki
    ; gno:storeEndpointDataset "my-dataset"
    ; gno:storeDefaultGraphSemantics "union"
.
```

::: warning

The automatic normalization only applies to read operations (SELECT, ASK, CONSTRUCT, DESCRIBE). For SPARQL UPDATE queries with WHERE clauses, the graph must be specified in the query itself. Use `Gno.default_graph_iri/0` to get the store-specific default graph IRI for interpolation:

```elixir
Gno.update("""
  WITH <#{Gno.default_graph_iri()}>
  DELETE { ?s <#{EX.p()}> ?old }
  INSERT { ?s <#{EX.p()}> "new" }
  WHERE  { ?s <#{EX.p()}> ?old }
""")
```

:::

## Store Adapters

### Fuseki

```turtle
@prefix gno: <https://w3id.org/gno#> .
@prefix gnoa: <https://w3id.org/gno/store/adapter/> .

<Fuseki> a gnoa:Fuseki
    ; gno:storeEndpointScheme "http"             # optional (default: "http")
    ; gno:storeEndpointHost "localhost"          # optional (default: "localhost")
    ; gno:storeEndpointPort 3030                 # optional (default: 3030)
    ; gno:storeEndpointDataset "my-dataset"      # required
.
```

The adapter constructs SPARQL endpoint URLs from the scheme, host, port, and dataset name according to Fuseki's conventions.

### Oxigraph

```turtle
@prefix gno: <https://w3id.org/gno#> .
@prefix gnoa: <https://w3id.org/gno/store/adapter/> .

<Oxigraph> a gnoa:Oxigraph
    ; gno:storeEndpointScheme "http"             # optional (default: "http")
    ; gno:storeEndpointHost "localhost"          # optional (default: "localhost")
    ; gno:storeEndpointPort 7878                 # optional (default: 7878)
.
```

All properties have sensible defaults, so a minimal `<Oxigraph> a gnoa:Oxigraph .` is sufficient for a local development setup.

### QLever

```turtle
@prefix gno: <https://w3id.org/gno#> .
@prefix gnoa: <https://w3id.org/gno/store/adapter/> .

<Qlever> a gnoa:Qlever
    ; gno:storeEndpointScheme "http"              # optional (default: "http")
    ; gno:storeEndpointHost "localhost"           # optional (default: "localhost")
    ; gno:storeEndpointPort 7001                  # optional (default: 7001)
    ; gnoa:qleverAccessToken "my-access-token"    # required for write operations
.
```

QLever uses a single endpoint for all operations. Write operations require an access token configured via `gnoa:qleverAccessToken`.

::: warning

QLever does not support SPARQL graph management operations LOAD, CLEAR, CREATE, ADD, COPY, and MOVE.

:::

### GraphDB

```turtle
@prefix gno: <https://w3id.org/gno#> .
@prefix gnoa: <https://w3id.org/gno/store/adapter/> .

<GraphDB> a gnoa:GraphDB
    ; gno:storeEndpointScheme "http"              # optional (default: "http")
    ; gno:storeEndpointHost "localhost"           # optional (default: "localhost")
    ; gno:storeEndpointPort 7200                  # optional (default: 7200)
    ; gno:storeEndpointDataset "my-repository"   # required
.
```

A GraphDB repository must be created before use, e.g. through the [GraphDB Workbench](https://graphdb.ontotext.com/documentation/11.0/workbench/creating-a-repository.html) or the [REST API](https://graphdb.ontotext.com/documentation/11.0/manage-repos-with-restapi.html). The `gno:storeEndpointDataset` value must match the repository ID.

GraphDB uses union default graph semantics by default. If a repository is configured for isolated semantics, this can be declared via `gno:storeDefaultGraphSemantics "isolated"`.

### Generic Store

For any other SPARQL 1.1-compatible store, you can configure the endpoints generically using the general `gno:Store` class:

```turtle
@prefix gno: <https://w3id.org/gno#> .

<MyStore> a gno:Store
    ; gno:storeQueryEndpoint <http://localhost:7878/query>          # required
    ; gno:storeUpdateEndpoint <http://localhost:7878/update>        # optional
    ; gno:storeGraphStoreEndpoint <http://localhost:7878/store>     # optional
.
```

## Application Configuration

In your `config/config.exs`, configure the manifest loading:

```elixir
config :dcatr,
  env: Mix.env(),
  load_path: ["config/gno"],
  manifest_type: Gno.Manifest,
  manifest_base: "http://example.com/"
```

The `load_path` specifies where to look for manifest files. The `manifest_base` sets the base URI for resolving relative URIs in the manifest files.

## Loading the Configuration

Once configured, load the service programmatically:

```elixir
# Load the full manifest
{:ok, manifest} = Gno.manifest()

# Load just the service (most common)
{:ok, service} = Gno.service()

# Load the store directly
{:ok, store} = Gno.store()
```

## Setting Up the Repository

Before you can use the repository for the first time, it needs to be initialized in the store. This is a one-time operation that creates the necessary graphs and writes the repository manifest to the store.

The recommended way is to use the Mix task:

```bash
mix gno.setup
```

Alternatively, you can call it programmatically:

```elixir
{:ok, service} = Gno.setup()
```

The setup will fail if the repository is already initialized. To tear down an existing repository (e.g. during development), use:

```bash
mix gno.teardown
```

::: warning

`mix gno.teardown` is a destructive operation that permanently deletes repository data. Only use it in development or testing environments.

:::
