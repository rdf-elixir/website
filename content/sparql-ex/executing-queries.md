# Queries against RDF.ex

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
#RDF.Graph<name: nil
  @prefix foaf: <http://xmlns.com/foaf/0.1/> .
  @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
  @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
  @prefix schema: <http://schema.org/> .
  @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

  [
      schema:email <mailto:peter@example.org> ;
      schema:name "Peter Goodguy"
  ] .

  [
      schema:email <mailto:jlow@example.com> ;
      schema:name "Johnny Lee Outlaw"
  ] .
>
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
