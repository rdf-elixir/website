# Executing queries

Let's say we have an RDF.ex graph like this:

```elixir
graph = RDF.Turtle.read_string! """
  @prefix foaf:  <http://xmlns.com/foaf/0.1/> .
  
  _:a  foaf:name   "Johnny Lee Outlaw" .
  _:a  foaf:mbox   <mailto:jlow@example.com> .
  _:b  foaf:name   "Peter Goodguy" .
  _:b  foaf:mbox   <mailto:peter@example.org> .
  _:c  foaf:mbox   <mailto:carol@example.org> .
  """
```


We can execute the following SPARQL query:

```elixir
query = """
  PREFIX foaf:   <http://xmlns.com/foaf/0.1/>
  SELECT ?name ?mbox
  WHERE
    { ?x foaf:name ?name .
      ?x foaf:mbox ?mbox }
  """
```

like this:

```elixir
SPARQL.execute_query(graph, query)
```

This will return a `SPARQL.Query.Result` struct which contains the results under the `results` field as a list of maps with the bindings of the solutions.

```elixir
%SPARQL.Query.Result{
  results: [
    %{"mbox" => ~I<mailto:peter@example.org>, "name" => ~L"Peter Goodguy"},
    %{"mbox" => ~I<mailto:jlow@example.com>, "name" => ~L"Johnny Lee Outlaw"}
  ],
  variables: ["name", "mbox"]
}
```

The list of results for a single variable can be fetched with the `SPARQL.Query.Result.get/2` function.

```elixir
SPARQL.execute_query(graph, query) 
|> SPARQL.Query.Result.get(:mbox)
```

If `SPARQL.execute_query/2` is used to execute a `CONSTRUCT` query, it will return an `RDF.Graph`:

```elixir
iex> SPARQL.execute_query graph, """
...>  PREFIX foaf:   <http://xmlns.com/foaf/0.1/>
...>  PREFIX schema: <http://schema.org/>
...>  CONSTRUCT   
...>    { ?x schema:name ?name ;
...>         schema:email ?mbox }
...>  WHERE
...>    { ?x foaf:name ?name ;
...>         foaf:mbox ?mbox }
...>  """
#RDF.Graph{name: nil
     ~B<b0>
         ~I<http://schema.org/email>
             ~I<mailto:peter@example.org>
         ~I<http://schema.org/name>
             ~L"Peter Goodguy" 
     ~B<b1>
         ~I<http://schema.org/email>
             ~I<mailto:jlow@example.com>
         ~I<http://schema.org/name>
             ~L"Johnny Lee Outlaw"}
```

The `SPARQL.execute_query/2` function converts a given query string implicitly to a `SPARQL.Query` struct. If you intend to execute the query multiple times it's better to do this step on your own with the `SPARQL.query/1` function and pass the interpreted query directly to `SPARQL.execute_query/2`, in order to not parse the query on every execution.

```elixir
query = SPARQL.query """
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>
  SELECT ?name ?mbox
  WHERE
    { ?x foaf:name ?name .
      ?x foaf:mbox ?mbox }
  """

SPARQL.execute_query(graph, query)
```

## Default prefixes

By default the configured `RDF.default_prefixes/0` are defined before every query. See the section about [Managing prefixes](/../rdf-ex/serializations) for more on that. So, unless you've configured additional `default_prefixes` or set `use_standard_prefixes` to `false`, you'll get these prefixes implicitly and can use them on every query without having to define them all the time.

```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
```

You can also provide your own query-specific default prefixes with the `default_prefixes` option on the `SPARQL.query/1` function. Setting this option to `nil` or an empty map disables the `default_prefixes` just on a single query.

::: tip
The prefixes you're using in your query are also used for the `RDF.Graph` build with `CONSTRUCT` queries, so it might be useful to also specify additional prefixes in `CONSTRUCT` queries, which are not directly used in your query but in the nodes of the resulting graph (although you can also add those later programmatically with `RDF.Graph.add_prefixes/2`).
:::

