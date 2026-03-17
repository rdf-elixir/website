# Managing data

Gno provides several ways to modify RDF data, from direct SPARQL updates to structured changesets with transactional commits.

## Direct data operations

The simplest way to modify data is through direct insert and delete operations with [RDF.ex data structures](/rdf-ex/data-structures):

```elixir
graph = RDF.graph(EX.S |> EX.p(EX.O))

# Insert data
:ok = Gno.insert_data(graph)

# Insert into a specific graph
:ok = Gno.insert_data(graph, graph: "http://example.org/my-graph")

# Delete data
:ok = Gno.delete_data(graph)
```

You can also insert `RDF.Description` values directly:

```elixir
:ok = Gno.insert_data(EX.S |> EX.p(EX.O))
```

### Loading remote data

`Gno.load/2` loads RDF data from a dereferenced IRI:

```elixir
:ok = Gno.load("http://dbpedia.org/resource/Berlin")

:ok = Gno.load("http://dbpedia.org/resource/Berlin",
                graph: "http://example.org/my-graph")
```

## SPARQL updates

For more complex modifications, you can execute SPARQL update queries:

```elixir
Gno.insert("""
  PREFIX dc: <http://purl.org/dc/elements/1.1/>

  INSERT
  { GRAPH <http://example.org/books> { ?book dc:title "New Title" } }
  WHERE
  { GRAPH <http://example.org/books> { ?book dc:title "Old Title" } }
""")
```

`Gno.delete/2` and `Gno.update/2` (combined DELETE + INSERT) work similarly.

::: warning

For SPARQL update operations (`INSERT`, `DELETE`, `UPDATE`), the graph must be specified in the query itself. The `:graph` option only works with data operations and graph management operations.

:::

## Graph management

Gno supports all SPARQL 1.1 graph management operations:

```elixir
# Create a new graph
Gno.create("http://example.org/my-graph")

# Remove all triples from a graph
Gno.clear(:default)

# Remove a graph completely
Gno.drop("http://example.org/my-graph")

# Copy all statements from one graph to another (replacing destination)
Gno.copy("http://example.org/graph1", "http://example.org/graph2")

# Add statements from one graph to another (keeping existing)
Gno.add("http://example.org/graph1", "http://example.org/graph2")

# Move statements (remove from source)
Gno.move("http://example.org/graph1", "http://example.org/graph2")
```

These operations accept the special values `:default`, `:primary`, `:named`, and `:all` where applicable.

## Changesets

For structured changes, Gno provides a changeset system. A changeset declares intended changes through four actions:

- **add** - insert new statements
- **update** - add statements while removing existing values for the same subject/predicate combinations (property-level overwrite)
- **replace** - add statements while removing all existing statements about the same subjects (subject-level overwrite)
- **remove** - delete statements

```elixir
{:ok, changeset} = Gno.changeset(
  add: EX.S |> EX.p(EX.O1),
  remove: EX.S |> EX.p(EX.O2)
)
```

You can also combine multiple action types:

```elixir
{:ok, changeset} = Gno.changeset(
  add: RDF.graph(EX.S1 |> EX.p(EX.O1)),
  update: RDF.graph(EX.S2 |> EX.p(EX.O2)),
  replace: RDF.graph(EX.S3 |> EX.p(EX.O3)),
  remove: RDF.graph(EX.S4 |> EX.p(EX.O4))
)
```

### Effective changesets

Before applying a changeset, you can convert it to an effective changeset. This queries the current state of the data and computes only the minimal changes actually needed. For example, statements that already exist are not added again, and statements that don't exist are not removed.

```elixir
# Insert some data first
Gno.insert_data(EX.S |> EX.p(EX.O1))

# The effective changeset will only contain the new statement
{:ok, effective} = Gno.effective_changeset(add: EX.S |> EX.p([EX.O1, EX.O2]))
# => only EX.S |> EX.p(EX.O2) in the add action, since EX.O1 already exists
```

## Commits

`Gno.commit/2` applies changes transactionally. It accepts the same change specifications as `Gno.changeset/1`:

```elixir
{:ok, commit} = Gno.commit(add: EX.S |> EX.p(EX.O))
```

The commit system:

- Computes the effective changeset automatically
- Applies changes within a transaction
- Rolls back automatically on failure
- Runs the configured middleware pipeline (e.g. logging, validation)

You can also pass a pre-built changeset:

```elixir
{:ok, changeset} = Gno.changeset(add: EX.S |> EX.p(EX.O))
{:ok, commit} = Gno.commit(changeset)
```

### Middleware

The commit processor supports a middleware pipeline for extensible processing. Middleware is configured on the service through a `gno:CommitOperation` linked via `gno:serviceCommitOperation`.

Here is an example that configures the built-in `gno:CommitLogger` middleware in the service manifest:

```turtle
@prefix gno: <https://w3id.org/gno#> .

<Service> a gno:Service
    ; gno:serviceCommitOperation <CommitOperation>
    # ... other service properties
.

<CommitOperation> a gno:CommitOperation
    ; gno:commitMiddleware ( 
        <Logger> 
    )
.

<Logger> a gno:CommitLogger
    ; gno:commitLogLevel "debug"      # optional (default: "info")
    ; gno:commitLogChanges true       # optional (default: false)
    ; gno:commitLogMetadata true      # optional (default: false)
.
```

The middleware pipeline runs in the order specified in the `gno:commitMiddleware` list. Each middleware receives state transition notifications during the commit lifecycle and can participate in rollback on failure.

Custom middleware can be implemented using the `Gno.CommitMiddleware` behaviour. See the [API documentation](https://hexdocs.pm/gno/Gno.CommitMiddleware.html) for details.
