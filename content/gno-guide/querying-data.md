# Querying data

Gno provides functions for all SPARQL query forms. These functions execute queries against the configured store backend, with graph resolution handled automatically through the service.

All query functions accept the general options described in the [Introduction](./):

- `:service` - use a specific service instead of the default from the manifest
- `:graph` - the target graph: a [graph selector](/gno-guide/configuration#graph-selectors) (e.g. `:default`, `:primary`), a graph ID, or a configured [local graph name](/gno-guide/configuration#graph-ids-and-graph-names)

## SELECT queries

`Gno.select/2` executes a SPARQL SELECT query and returns a `SPARQL.Query.Result`:

```elixir
{:ok, result} = Gno.select("SELECT ?s ?p ?o WHERE { ?s ?p ?o }")
result.results
# => [%{"s" => ~I<http://example.org/S>, "p" => ~I<http://example.org/p>, ...}, ...]
```

## ASK queries

`Gno.ask/2` executes a SPARQL ASK query and returns a boolean:

```elixir
{:ok, true} = Gno.ask("ASK WHERE { <http://example.org/S> ?p ?o }")
```

## CONSTRUCT queries

`Gno.construct/2` executes a SPARQL CONSTRUCT query and returns an `RDF.Graph`:

```elixir
{:ok, graph} = Gno.construct("""
  CONSTRUCT { ?s <http://example.org/name> ?name }
  WHERE { ?s <http://xmlns.com/foaf/0.1/name> ?name }
""")
```

## DESCRIBE queries

`Gno.describe/2` executes a SPARQL DESCRIBE query and returns an `RDF.Graph`:

```elixir
{:ok, graph} = Gno.describe("DESCRIBE <http://example.org/resource>")
```

## Fetching graphs

`Gno.graph/2` retrieves an entire graph from the store:

```elixir
# Get the default graph
{:ok, graph} = Gno.graph(:default)

# Get the primary data graph
{:ok, graph} = Gno.graph(:primary)

# Get the repository manifest graph
{:ok, graph} = Gno.graph(:repo_manifest)

# Get a specific graph by IRI
{:ok, graph} = Gno.graph("http://example.org/my-graph")
```

See [Graph Selectors](/gno-guide/configuration#graph-selectors) for details on the available symbolic names and how they are resolved.

## Bang variants

All query functions have bang variants (`select!`, `ask!`, `construct!`, `describe!`, `graph!`) that raise on errors instead of returning error tuples:

```elixir
graph = Gno.graph!(:default)
```
