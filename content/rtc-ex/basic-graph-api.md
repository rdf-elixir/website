# Basic Graph API

Generally, an `RTC.Compound` can be used almost interchangeable with an `RDF.Graph`, as it tries to be as API-compatible as possible with respect to the triples it includes.


## Creating compounds from scratch

A new compound with a set of triples can be created with the `RTC.Compound.new/3` function.
Besides the triples as the first argument, it expects an optional identifier for the compound and some optional keyword options.
As with all functions that expect triples, the triples can be given in any of the supported input forms of RDF.ex (as described [here](/rdf-ex/data-structures.html#input-forms)).

```elixir
# creating a compound from a single triple

iex> RTC.Compound.new({EX.S, EX.P, EX.O}, EX.Compound)
#RTC.Compound<id: ~I<http://example.com/Compound>
  @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
  @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
  @prefix rtc: <https://w3id.org/rtc#> .
  @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

  <http://example.com/Compound>
      rtc:elements << <http://example.com/S> <http://example.com/P> <http://example.com/O> >> .

  <http://example.com/S>
      <http://example.com/P> <http://example.com/O> .
>

# creating a compound from a RDF.Description

iex> EX.S 
...> |> EX.p1(EX.O1)
...> |> EX.p2(EX.O2)
...> |> RTC.Compound.new(EX.Compound, prefixes: [ex: EX])
#RTC.Compound<id: ~I<http://example.com/Compound>
  @prefix ex: <http://example.com/> .
  @prefix rtc: <https://w3id.org/rtc#> .

  ex:Compound
      rtc:elements << ex:S ex:p1 ex:O1 >>, << ex:S ex:p2 ex:O2 >> .

  ex:S
      ex:p1 ex:O1 ;
      ex:p2 ex:O2 .
>

# creating a compound from a RDF.Graph

iex> """
...> @prefix ex: <http://example.com/> .
...> 
...> ex:S 
...>   ex:p1 ex:O1 ;
...>   ex:p2 ex:O2 .
...> """
...> |> RDF.Turtle.read_string!()
...> |> RTC.Compound.new(EX.Compound)
#RTC.Compound<id: ~I<http://example.com/Compound>
  @prefix ex: <http://example.com/> .
  @prefix rtc: <https://w3id.org/rtc#> .

  ex:Compound
      rtc:elements << ex:S ex:p1 ex:O1 >>, << ex:S ex:p2 ex:O2 >> .

  ex:S
      ex:p1 ex:O1 ;
      ex:p2 ex:O2 .
>
```
::: warning

`RTC.Compound.new/3` is the only function whose API is a bit different than the counterpart on `RDF.Graph`. The first argument must be the initial triples. If you really want to create an empty compound, you can do so by providing an empty list (or map) as the first argument.

```elixir
RTC.Compound.new([], EX.Compound)
```

Another difference is that the identifier of the compound is not provided via the `:name` keyword option, but as the second argument. All other options of `RDF.Graph.new/2` can be used similarly on `RTC.Compound.new/3`, but with a little different semantics as described below.
:::


### Auto-generated ids

The `new` function can also be called without specifying a compound id. In this case a BlankNode is automatically created and used as the compound id.

```elixir
iex> RTC.Compound.new([{EX.S, EX.p(), EX.O}]) |> RTC.Compound.id()
~B<b867>
```

This identifier creation behavior, however, can be configured and customized via `RDF.Resource.Generator`s.
For example, to create UUIDv4 URIs instead, you could use this application configuration in your `config.exs`:

```elixir
config :rtc, :id,
  generator: RDF.IRI.UUID.Generator,
  uuid_version: 4,
  prefix: "http://example.com/ns/"
```

With this configuration in place the same function call leads to a compound like this:

```elixir
iex> RTC.Compound.new([{EX.S, EX.p(), EX.O}]) |> RTC.Compound.id()
~I<http://example.com/ns/911f2951-a701-4ec1-a1bb-0b3645c2d45f>
```

Various other functions which create compounds implicitly use this configured resource generator. 
See [the guide on resource generators](/rdf-ex/resource-generators.html) for more information and available generators.



## Assertion modes

An `RTC.Compound` can contain both asserted and unasserted triples. Unasserted triples are those that occur only as quoted triples, but are not stated as normal triple of a RDF graph.

By default, triples added to a compound are interpreted as asserted. This behavior of the `new/3` and `add/3` functions, however, can be changed by the following configuration in the application environment.

```elixir
config :rtc, :assertion_mode, :unasserted
```
The default behavior can be overridden via the `:assertion_mode` option on individual calls of these functions.

```elixir
iex> {EX.S1, EX.P1, EX.O1} 
...> |> RTC.Compound.new(EX.Compound, assertion_mode: :unasserted, prefixes: [ex: EX])
...> |> RTC.Compound.add({EX.S2, EX.P2, EX.O2}, assertion_mode: :unasserted)
...> |> RTC.Compound.add({EX.S3, EX.P3, EX.O3})
#RTC.Compound<id: ~I<http://example.com/Compound>
  @prefix ex: <http://example.com/> .
  @prefix rtc: <https://w3id.org/rtc#> .

  ex:Compound
      rtc:elements 
        << ex:S1 ex:P1 ex:O1 >>, 
        << ex:S2 ex:P2 ex:O2 >>, 
        << ex:S3 ex:P3 ex:O3 >> .

  ex:S3
      ex:P3 ex:O3 .
>
```

## Accessing the triples in a compound

As we mentioned in the beginning, the `RTC.Compound` functions for accessing the triples of a compound are mostly compatible with the `RDF.Graph` API. So, many of its functions for querying or updating the triples are available:

- `RTC.Compound.add/3`
- `RTC.Compound.delete/3`
- `RTC.Compound.delete_descriptions/3`
- `RTC.Compound.descriptions/2`
- `RTC.Compound.description/3`
- `RTC.Compound.get/3`
- `RTC.Compound.fetch/3`
- `RTC.Compound.describes?/3`
- `RTC.Compound.empty?/2`
- `RTC.Compound.include?/3`
- `RTC.Compound.triples/2`
- `RTC.Compound.pop/1`
- `RTC.Compound.pop/3`
- `RTC.Compound.subjects/2`
- `RTC.Compound.predicates/2`
- `RTC.Compound.objects/2`
- `RTC.Compound.resources/2`

```elixir
iex> EX.S
...> |> EX.p(EX.O)
...> |> RTC.Compound.new(EX.Compound, prefixes: [ex: EX])
...> |> RTC.Compound.add({EX.S, EX.p(), EX.O2})
#RTC.Compound<id: ~I<http://example.com/Compound>
  @prefix ex: <http://example.com/> .
  @prefix rtc: <https://w3id.org/rtc#> .

  ex:Compound
      rtc:elements << ex:S ex:p ex:O >>, << ex:S ex:p ex:O2 >> .

  ex:S
      ex:p ex:O, ex:O2 .
>
```

::: warning

The `RTC.Compound.put/2` function ist not supported yet as its specific semantics with respect to sub-compound is not decided yet.

Also, the `RDF.Graph` functions to make individual RDF-star triple annotations are not supported yet (as well as the respective options on the compound update functions).
The capability to support RDF-star annotations of individual triples as part of a compound is also not available yet.
:::

All of these functions support the `:assertion_mode` option to limit the query or operation to either the asserted triples with the `:asserted` value or the unasserted triples with the value `:unasserted`. Default is the value `:all` with which the query or operation is executed on all triples.

```elixir
iex> compound = 
...>   RTC.Compound.new({EX.S, EX.p1(), EX.O1}, EX.Compound, prefixes: [ex: EX]) 
...>   |> RTC.Compound.add({EX.S, EX.p2(), EX.O2}, assertion_mode: :unasserted)
#RTC.Compound<id: ~I<http://example.com/Compound>
  @prefix ex: <http://example.com/> .
  @prefix rtc: <https://w3id.org/rtc#> .

  ex:Compound
      rtc:elements << ex:S ex:p1 ex:O1 >>, << ex:S ex:p2 ex:O2 >> .

  ex:S
      ex:p1 ex:O1 .
>

iex> RTC.Compound.delete_descriptions(compound, EX.S, assertion_mode: :asserted)
#RTC.Compound<id: ~I<http://example.com/Compound>
  @prefix ex: <http://example.com/> .
  @prefix rtc: <https://w3id.org/rtc#> .

  ex:Compound
      rtc:elements << ex:S ex:p2 ex:O2 >> .
>

iex> RTC.Compound.triples(compound, assertion_mode: :unasserted)
[
  {~I<http://example.com/S>, ~I<http://example.com/p2>, ~I<http://example.com/O2>}
]
```

Just like for `RDF.Graph`, Elixir's `Enumerable` protocol is implemented for the `RTC.Compound` struct by means of the contained triples, which means all `Enum` functions can be used with a `RTC.Compound`.

```elixir
iex> EX.S 
...> |> EX.p1(EX.O1)
...> |> EX.p2(EX.O2)
...> |> RTC.Compound.new(EX.Compound)
...> |> Enum.to_list()
[
  {~I<http://example.com/S>, ~I<http://example.com/p1>,
   ~I<http://example.com/O1>},
  {~I<http://example.com/S>, ~I<http://example.com/p2>,
   ~I<http://example.com/O2>}
]
```

Also the `RDF.Data` protocol is implemented for `RTC.Compound`. In the `RDF.Data.merge/2` function the graph name plays a crucial role, as the merge of different graphs with different names results in a `RDF.Dataset`. But since compounds are just a bunch of triples inside a graph, the protocol implementation of `RDF.Data.merge/2` behaves different than the one for `RDF.Graph`s. The compound id or configured graph name of a compound is ignored and the compound is treated just like a set of triples. So, applying `RDF.Data.merge/2` on a `RTC.Compound` with any other RDF.ex data structure or another compound always returns a `RDF.Graph`.

```elixir
iex> RDF.Graph.new({EX.S, EX.p(), EX.O1})
...> |> RDF.Data.merge(RTC.Compound.new([{EX.S, EX.p(), EX.O2}], EX.Compound))
#RDF.Graph<name: nil
  @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
  @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
  @prefix rtc: <https://w3id.org/rtc#> .
  @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

  <http://example.com/S>
      <http://example.com/p> <http://example.com/O1>, <http://example.com/O2> .
>
```

The only difference from this rule is when merging with a `RDF.Dataset`. In that case the graph name, i.e. by default the compound id, is taken into account and the triples will be merged into a graph of that name

```elixir
iex> RDF.Dataset.new({EX.S, EX.p(), EX.O1})
...> |> RDF.Data.merge(RTC.Compound.new([{EX.S, EX.p(), EX.O2}], EX.Compound))
#RDF.Dataset{name: nil, graph_names: [nil, ~I<http://example.com/Compound>]}
```


## Retrieving the graph of the included triples

An `RDF.Graph` with just the contained triples in a compound can be retrieved with the `RTC.Compound.graph/2` function.

```elixir
iex> EX.S 
...> |> EX.p1(EX.O1)
...> |> EX.p2(EX.O2)
...> |> RTC.Compound.new(EX.Compound)
...> |> RTC.Compound.graph()
#RDF.Graph<name: ~I<http://example.com/Compound>
  @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
  @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
  @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

  <http://example.com/S>
      <http://example.com/p1> <http://example.com/O1> ;
      <http://example.com/p2> <http://example.com/O2> .
>
```

The following options can be used to customize the returned graph:

- `:name`: The name of the graph to be created. By default, the compound id is used as the graph name, unless it is a blank node, in which case the graph won't be named.
- `:prefixes`: Prefix mappings which should be added to the RDF graph and will be used when serializing in a format with prefix support. Default are the `RDF.default_prefixes/0` together with the `rtc` prefix.
- `:base_iri`: The base IRI which should be stored in the RDF graph and will be used when serializing in a format with base IRI support.

```elixir
iex> EX.S 
...> |> EX.p1(EX.O1)
...> |> EX.p2(EX.O2)
...> |> RTC.Compound.new(EX.Compound)
...> |> RTC.Compound.graph(name: EX.GraphName, prefixes: [ex: EX])
#RDF.Graph<name: ~I<http://example.com/GraphName>
  @prefix ex: <http://example.com/> .

  ex:S
      ex:p1 ex:O1 ;
      ex:p2 ex:O2 .
>
```

The default values to be used when generating the graph can also be specified when initializing the compound with `new/3`.

```elixir
iex> EX.S 
...> |> EX.p1(EX.O1)
...> |> EX.p2(EX.O2)
...> |> RTC.Compound.new(EX.Compound, name: EX.GraphName, prefixes: [ex: EX])
...> |> RTC.Compound.graph()
#RDF.Graph<name: ~I<http://example.com/GraphName>
  @prefix ex: <http://example.com/> .

  ex:S
      ex:p1 ex:O1 ;
      ex:p2 ex:O2 .
>
```


## Retrieving the complete graph representation of a compound

The complete RDF-star graph containing not only the triples but also their annotations (discussed in the next section), but more importantly also including the RTC statements which constitute the compound, can be generated with the function `RTC.Compound.to_rdf/2`.

```elixir
iex> EX.S 
...> |> EX.p1(EX.O1)
...> |> EX.p2(EX.O2)
...> |> RTC.Compound.new(EX.Compound)
...> |> RTC.Compound.to_rdf()
#RDF.Graph<name: ~I<http://example.com/Compound>
  @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
  @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
  @prefix rtc: <https://w3id.org/rtc#> .
  @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

  <http://example.com/S>
      <http://example.com/p1> <http://example.com/O1> {| rtc:elementOf <http://example.com/Compound> |} ;
      <http://example.com/p2> <http://example.com/O2> {| rtc:elementOf <http://example.com/Compound> |} .
>
```

Again, the generated graph can be configured with the same keyword options as the `to_graph/2` function, and the defaults specified on `new/3` are also used here. Additionally, the `:element_style` keyword option can be used to specify which RTC property should be used to assign the statements to the compound.

- With `:element_of` the property `rtc:elementOf` is used, which is the default as can be seen above. 
- With `:elements` the inverse property `rtc:elements` is used.

```elixir
iex> EX.S 
...> |> EX.p1(EX.O1)
...> |> EX.p2(EX.O2)
...> |> RTC.Compound.new(EX.Compound)
...> |> RTC.Compound.to_rdf(element_style: :elements)
#RDF.Graph<name: ~I<http://example.com/Compound>
  @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
  @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
  @prefix rtc: <https://w3id.org/rtc#> .
  @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

  <http://example.com/Compound>
      rtc:elements 
        << <http://example.com/S> <http://example.com/p1> <http://example.com/O1> >>, 
        << <http://example.com/S> <http://example.com/p2> <http://example.com/O2> >> .

  <http://example.com/S>
      <http://example.com/p1> <http://example.com/O1> ;
      <http://example.com/p2> <http://example.com/O2> .
>
```

The default `:element_style` can also be configured in the `config.exs` files of your application

```elixir
config :rtc, :element_style, :elements
```


## Loading a compound from a graph

With the function `RTC.Compound.from_rdf/2` a compound can be loaded from a `RDF.Graph`, given as the first argument, followed by the id of the compound to be loaded.

```elixir
RTC.Compound.from_rdf(graph, EX.Compound)
```


## Loading a compound from a SPARQL endpoint

With `RTC.Compound.from_sparql/3` a compound can also be loaded from a triple store. The function expects the URL of a SPARQL endpoint and the id of the compound to be loaded.

```elixir
RTC.Compound.from_sparql("http://example.com/sparql", EX.Compound)
```

::: warning

`RTC.Compound.from_sparql/3` is available only when `sparql_client` is added as a dependency. 
See also the [SPARQL.Client configuration page](/sparql-ex/sparql-client-configuration) on how to setup the HTTP client to be used.

:::


The options can be used to configure the `SPARQL.Client.query/3` call made for sending the query. These can be quite important to work with the different SPARQL-star implementations of triple stores, which result from the unspecified media-types to be used for RDF-star results. Since under the hood a CONSTRUCT query is executed, the respective options to return RDF-star results must be provided. For example, Ontotext GraphDB requires to following options:

```elixir
RTC.Compound.from_sparql("http://example.com/sparql", EX.Compound, 
    accept_header: "application/x-turtlestar", result_format: :turtle)
```

The options to be used by default on `from_sparql/3` can also be configured on the `:from_sparql_opts` environment key in your `config.exs` files.

```elixir
config :rtc, :from_sparql_opts,
    accept_header: "application/x-turtlestar",
    result_format: :turtle
```

See the [SPARQL.Client API documentation](https://hexdocs.pm/sparql_client/SPARQL.Client.html) for the available options. 

::: warning

Since RTC is fundamentally based on RDF-star, this feature only works with triple stores that support SPARQL-star.

:::


::: tip

In case you're missing a function to insert a compound into a triple store: there is no such function in RTC.ex, since that can be done pretty straightforward with the general `SPARQL.Client.insert_data/2` and `RTC.Compound.to_rdf/1` function.

```elixir
compound
|> RTC.Compound.to_rdf()
|> SPARQL.Client.insert_data("http://example.com/sparql")
```

:::
