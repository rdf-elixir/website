# RDF data structures

RDF.ex provides various data structures for collections of statements:

- `RDF.Description`: a collection of triples about the same subject
- `RDF.Graph`: a named collection of statements
- `RDF.Dataset`:  a named collection of graphs, i.e. a collection of statements from different graphs; it may have multiple named graphs and at most one unnamed ("default") graph

All of these structures have similar sets of functions and implement Elixirs `Enumerable` and `Collectable` protocol, Elixirs `Access` behaviour and the `RDF.Data` protocol of RDF.ex.


## Construction

The `new` function of these data structures create new instances of the struct. `RDF.Description.new` requires at least an IRI or blank node for the subject, while `RDF.Graph.new` and `RDF.Dataset.new` take an optional IRI for the name of the graph or dataset via the `name` option.

```elixir
empty_description = RDF.Description.new(EX.Subject)

empty_unnamed_graph = RDF.Graph.new
empty_named_graph   = RDF.Graph.new(name: EX.Graph)

empty_unnamed_dataset = RDF.Dataset.new
empty_named_dataset   = RDF.Dataset.new(name: EX.Dataset)
```

As you can see, qualified terms from a vocabulary namespace can be given instead of an IRI and will be resolved automatically. This applies to all of the functions discussed below.

The `new` functions can be called more shortly with the respective delegator functions `RDF.description`, `RDF.graph` and `RDF.dataset`.  

The `new` functions also take optional initial data, which can be provided in various forms. Basically it takes the given data and hands it to the `add` function with the newly created struct. One way support by the `new` constructor of all three data structures is with the `:init` option.

```elixir
description = RDF.Description.new(EX.Subject, init: {EX.predicate, EX.Object})

unnamed_graph = RDF.Graph.new(init: {EX.Subject, EX.predicate, EX.Object})
named_graph   = RDF.Graph.new(name: EX.Graph, init: {EX.Subject, EX.predicate, EX.Object})

unnamed_dataset = RDF.Dataset.new(init: {EX.Subject, EX.predicate, EX.Object, EX.Graph})
named_dataset   = RDF.Dataset.new(name: EX.Dataset, init: {EX.Subject, EX.predicate, EX.Object})
```

The value of the `:init` option can also be a function (without args) which can return the data to be initialized in any form discussed in the next subsection.

```elixir
RDF.Graph.new(name: EX.Graph, init: &initializer_function/0)
```

On the `new` constructors of `RDF.Graph` and `RDF.Dataset` the data can also be passed directly in order to support its use with the pipeline operator.

```elixir
{EX.Subject, EX.predicate, EX.Object}
|> RDF.Graph.new(name: EX.Graph)

{EX.Subject, EX.predicate, EX.Object, EX.Graph}
|> RDF.Dataset.new()
```

This feature cannot be supported on `RDF.Description/new/2` since the subject is mandatory. But this shouldn't be such a big limitation, since often times `RDF.Description`s are created with the Description DSL introduced [here](/rdf-ex/description-and-graph-dsl.html#description-dsl).

::: danger
This form of passing the input data directly has one caveat: the input form of grouping multiple predicate-object pairs for a subject given as a vocabulary namespace term is not supported as it is indistinguishable from Keyword opts, eg. in this example the input won't be recognized correctly:

```elixir
[{EX.Subject, [{EX.p1(), EX.O1}, {EX.p2(), EX.O2}]}]
|> RDF.Graph.new()
```

For this reason the usage of the `:init` option variant is the recommended way to populate the data structures on construction. Use the direct passing variant only when you want to call the constructors in a pipeline and are sure that input in this form won't occur. 

A workaround if you really want to use this variant and can't exclude this form is to explicitly pass options:

```elixir
[{EX.Subject, [{EX.p1(), EX.O1}, {EX.p2(), EX.O2}]}] 
|> RDF.Graph.new(name: EX.Graph)

[{EX.Subject, [{EX.p1(), EX.O1}, {EX.p2(), EX.O2}]}] 
|> RDF.Graph.new([])
```
:::


## Input forms

In the last section we already encountered a couple of ways of how RDF statements can be provided as input to the `new/2` functions. There are more ways and all of them are commonly supported on all functions taking input data. Let's look at them one by one.

Most basically, single triple and quad tuples can be provided. As with all supported forms, the elements must not be RDF terms directly, as long they are coercible as discussed in the previous section about [Statements](statements).

```elixir
{EX.S, EX.p, EX.O}
{EX.S, EX.p, "string"}
{EX.S, EX.p, 42}

{EX.S, EX.p, EX.O, EX.Graph}
```

On the object position a list of objects can provided for multiple statements to the same subject and predicate.

```elixir
{EX.S, EX.p, [EX.O, "string", 42]}
```

Multiple predicate-object pairs to the same subject can be given via a two-element tuple of a subject and a list of predicate-object pairs. The object can also be a list in this form.

```elixir
{EX.S, [
    {EX.p2, EX.O1},
    {EX.p2, ["string", 42]},
  ]
}
```

The input data can also be given as a map.

```elixir
%{EX.S => %{
    EX.p2 => EX.O1,
    EX.p2 => ["string", 42]
  }
}
```

This nested map form for RDF statements however is only supported on `RDF.Graph` and `RDF.Dataset` functions. The `RDF.Description` operating only on RDF statements about the same subject supports the map form only with the inner  map with the predicate-object pairs. 

```elixir
%{
  EX.p2 => EX.O1,
  EX.p2 => ["string", 42]
}
```

The `RDF.Description` functions also supports the initially mentioned tuple forms, but the subject must match the subject of the description. Additionally however they support also two-element tuples with just the predicate and object(s).

Naturally it's also possible to provide the statements in the RDF data structures themselves. However, for any of RDF data structure only the respective RDF data structure itself and the smaller ones are supported:

- `RDF.Dataset` functions with input data support all three RDF data structures.
- `RDF.Graph` functions can only handle `RDF.Graph`s and `RDF.Description`s.
- `RDF.Description` only works with `RDF.Description`s themself. Unlike the other forms for input data however, the subject of an input description does not have to match the subject of the description on which the function is applied.

::: warning
One could expect that `RDF.Dataset` would support an additional nesting with graph names at the outer level, but this is not the case. Supporting this would have been relatively costly, since it would require always checking the depth of the given input. But it's also actually not needed for most cases, since the `RDF.Dataset` functions allow addressing the graph separately via the `graph` option.
:::

The input can be further shortened with the use of `RDF.PropertyMap`s, which are bidirectional mappings from atoms to IRIs of properties. They can be created from keyword lists or maps of terms to IRIs via the `new/1` function or its alias function `RDF.property_map/1`.

```elixir
iex> RDF.PropertyMap.new(%{type: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"})
%RDF.PropertyMap{:type <=> ~I<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>}

iex> RDF.property_map(foo: EX.foo, bar: EX.Bar)
%RDF.PropertyMap{
  :bar <=> ~I<http://example.com/Bar>,
  :foo <=> ~I<http://example.com/foo>
}
```

PropertyMaps can also be created from strict vocabulary namespaces, where term mappings are added for lowercased terms.

```elixir
iex> RDF.property_map(RDFS)
%RDF.PropertyMap{
  :comment <=> ~I<http://www.w3.org/2000/01/rdf-schema#comment>,
  :domain <=> ~I<http://www.w3.org/2000/01/rdf-schema#domain>,
  :isDefinedBy <=> ~I<http://www.w3.org/2000/01/rdf-schema#isDefinedBy>,
  :label <=> ~I<http://www.w3.org/2000/01/rdf-schema#label>,
  :member <=> ~I<http://www.w3.org/2000/01/rdf-schema#member>,
  :range <=> ~I<http://www.w3.org/2000/01/rdf-schema#range>,
  :seeAlso <=> ~I<http://www.w3.org/2000/01/rdf-schema#seeAlso>,
  :subClassOf <=> ~I<http://www.w3.org/2000/01/rdf-schema#subClassOf>,
  :subPropertyOf <=> ~I<http://www.w3.org/2000/01/rdf-schema#subPropertyOf>
}
```

All functions accepting input data support a `:context` option for which you can either pass a `RDF.ProperyMap` directly or one of the values from which a `RDF.ProperyMap` can be created implicitly. If the `:context` is defined you can use the atoms for the properties in any of the input forms.

```elixir
property_map = RDF.property_map(foo: EX.foo)
RDF.Description.add(description, [foo: "bar"], context: property_map)

RDF.Graph.add(graph, %{EX.S => %{subClassOf: EX.Class}}, context: RDFS)
```

Finally, lists of all the mentioned forms are accepted as input on the RDF data structures.

```elixir
[
  {EX.S1, EX.p1, O2},
  {EX.S2, [{EX.p2, ["string", 42]}]},
  %{EX.S3 => %{p3: EX.O3}},
  EX.p4(EX.S4, EX.O4)
]
```


## Adding statements

RDF statements can be added to the data structures with various functions, all which support all of the input forms introduced in the last section. Let's first define some example data structures on which we can exemplify the differences of the different functions.

```elixir
iex> description = EX.S |> EX.p1(EX.O1) |> EX.p2(EX.O2) 
#RDF.Description<
  <http://example.com/S>
      <http://example.com/p1> <http://example.com/O1> ;
      <http://example.com/p2> <http://example.com/O2> .
>

iex> graph = RDF.graph(description, prefixes: [ex: EX])
#RDF.Graph<name: nil
  @prefix ex: <http://example.com/> .

  ex:S
      ex:p1 ex:O1 ;
      ex:p2 ex:O2 .
>
```

The `add/3` functions of the RDF data structures merge the given statements with the existing ones.

```elixir
iex> RDF.Description.add(description, {EX.S, EX.p1, EX.New})
#RDF.Description<
  <http://example.com/S>
      <http://example.com/p1> <http://example.com/New>, <http://example.com/O1> ;
      <http://example.com/p2> <http://example.com/O2> .
>
iex> RDF.Graph.add(graph, %{EX.S => %{p1: EX.O}}, context: %{p1: EX.p1})
#RDF.Graph<name: nil
  @prefix ex: <http://example.com/> .

  ex:S
      ex:p1 ex:O, ex:O1 ;
      ex:p2 ex:O2 .
>
```

The `put/3` functions on the other hand overwrite existing statements, but behave differently in their overwriting behavior depending on the respective RDF data structure:

- `RDF.Description.put/3` overwrites only statements with same subject and predicate.
- `RDF.Graph.put/3` and `RDF.Dataset.put/3` both overwrite all statements with same subject.

```elixir
iex> RDF.Description.put(description, {EX.S, EX.p1, EX.New})
#RDF.Description<
  <http://example.com/S>
      <http://example.com/p1> <http://example.com/New> ;
      <http://example.com/p2> <http://example.com/O2> .
>
iex> RDF.Graph.put(graph, %{EX.S => %{p1: EX.New}}, context: %{p1: EX.p1})
#RDF.Graph<name: nil
  @prefix ex: <http://example.com/> .

  ex:S
      ex:p1 ex:New .
>
```

If you want to add statements to an `RDF.Graph` or `RDF.Dataset` with the same overwrite behavior as `RDF.Description.put/3`, i.e. only overwrite the statements with the same subject and predicate, you can use the `RDF.Graph.put_properties/3` and `RDF.Dataset.put_properties/3` functions.

```elixir
iex> RDF.Graph.put_properties(graph, %{EX.S => %{p1: EX.New}}, context: %{p1: EX.p1})
#RDF.Graph<name: nil
  @prefix ex: <http://example.com/> .

  ex:S
      ex:p1 ex:New ;
      ex:p2 ex:O2 .
>
```

As mentioned in the last section, When the subject of a statement doesn't match the subject of a description, `RDF.Description.add/3` ignores it and is a no-op, but when given a `RDF.Description` to add it ignores its subject and just adds its property-value pairs, because this is a common use case when merging the descriptions of differently named resources.

```elixir
iex> description = RDF.description(EX.S, init: {EX.p, EX.O1})
#RDF.Description<
  <http://example.com/S>
      <http://example.com/p> <http://example.com/O1> .
>
iex> RDF.Description.add(description, {EX.Other, EX.p, EX.O2})
#RDF.Description<
  <http://example.com/S>
      <http://example.com/p> <http://example.com/O1> .
>
iex> RDF.Description.add(description, RDF.description(EX.Other, init: {EX.p, EX.O2}))
#RDF.Description<
  <http://example.com/S>
      <http://example.com/p> <http://example.com/O1>, <http://example.com/O2> .
>
```

Since `put/3` is a destructive operation, `RDF.Description.put/3` does not replicate the behavior of `RDF.Description.add/3` to ignore the subject of descriptions. If you really want to overwrite the statements of a description with the ones from another description with `put/3` you'll have to explicitly change the subject of the input description with `RDF.Description.change_subject/2`.

```elixir
iex> other_description = RDF.description(EX.Other, init: {EX.p, EX.O2})
#RDF.Description<
  <http://example.com/Other>
      <http://example.com/p> <http://example.com/O2> .
>
iex> RDF.Description.put(description, other_description)
#RDF.Description<
  <http://example.com/S>
      <http://example.com/p> <http://example.com/O1> .
>
iex> RDF.Description.put(description, 
...>   RDF.Description.change_subject(other_description, description.subject))
#RDF.Description<
  <http://example.com/S>
      <http://example.com/p> <http://example.com/O2> .
>
```

As most of the functions of `RDF.Dataset` the functions for adding statements have essentially two modes in which they operate:

1. When called with a graph name via the `:graph` option, the function call is essentially delegated to the respective graph and the implementation of this function on `RDF.Graph`, which might even mean that input data from different graphs (eg. quads or `RDF.Graph`s with different graph names) becomes aggregated and get redirected to the specified graph.
2. Without a `:graph` option the all quads or `RDF.Graph`s in the input are directed to respective graphs.


```elixir
iex> dataset = RDF.dataset([
...>   (EX.S1 |> EX.p1(EX.O1)),
...>   {EX.S2, EX.p2, EX.O2, EX.Graph}
...> ])
%RDF.Dataset{name: nil, graph_names: [nil, ~I<http://example.com/Graph>]}

iex> RDF.Dataset.default_graph(dataset)
#RDF.Graph<name: nil
  <http://example.com/S1>
      <http://example.com/p1> <http://example.com/O1> .
>
iex> RDF.Dataset.graph(dataset, EX.Graph)
#RDF.Graph<name: ~I<http://example.com/Graph>
  <http://example.com/S2>
      <http://example.com/p2> <http://example.com/O2> .
>
iex> RDF.Dataset.add(dataset, [
...>   {EX.S1, EX.p1, "new"},
...>   {EX.S2, EX.p2, "new", EX.Graph}
...> ]) |> RDF.Dataset.graphs()
[#RDF.Graph<name: nil
  <http://example.com/S1>
      <http://example.com/p1> "new", <http://example.com/O1> .
>,
 #RDF.Graph<name: ~I<http://example.com/Graph>
  <http://example.com/S2>
      <http://example.com/p2> "new", <http://example.com/O2> .
>]
iex> RDF.Dataset.add(dataset, [
...>   {EX.S1, EX.p1, "new"},
...>   {EX.S2, EX.p2, "new", EX.Graph}
...> ], graph: nil) |> RDF.Dataset.graphs()
[#RDF.Graph<name: nil
  <http://example.com/S1>
      <http://example.com/p1> "new", <http://example.com/O1> .

  <http://example.com/S2>
      <http://example.com/p2> "new" .
>,
 #RDF.Graph<name: ~I<http://example.com/Graph>
  <http://example.com/S2>
      <http://example.com/p2> <http://example.com/O2> .
>]
```


Unlike the `add` function, which always returns the same data structure as the data structure to which the addition happens, which possible means ignoring some input statements (eg. when the subject of a statement doesn't match the description subject) or reinterpreting some parts of the input statement (eg. ignoring the subject of another description), the `merge` function of the `RDF.Data` protocol implemented by all three data structures will always add all of the input statements and possibly creates another type of data structure. For example, merging two `RDF.Description`s with different subjects results in a `RDF.Graph` or adding a quad to a `RDF.Graph` with a different name than the quad’s graph context results in a `RDF.Dataset`.

```elixir
RDF.Description.new(EX.S1, init: {EX.p, EX.O}) 
|> RDF.Data.merge(RDF.Description.new(EX.S2, init: {EX.p, EX.O})) # returns an unnamed RDF.Graph
|> RDF.Data.merge(RDF.Graph.new({EX.S2, EX.p, EX.O2}, name: EX.Graph)) # returns a RDF.Dataset
```

Finally, the `update/4` functions allows updating of specified elements in the RDF data structures with a custom update function based on the previous values.

- `RDF.Description.update/4` updates the objects of the given predicate with the results of the update function which receives the previous objects and can either return a single or multiple new objects to be set or `nil` if all statements with this predicate should be deleted.
- `RDF.Graph.update/4` updates the description of the given subject with the results of the update function which receives the previous `RDF.Description` and can either return all supported input formats for `RDF.Description`s or `nil` if the description should be deleted.

```elixir
iex> RDF.description(EX.S, init: {EX.p, 42})
...> |> RDF.Description.update(EX.p, fn [object] -> 
...>      XSD.Integer.value(object) + 1 
...> end)
#RDF.Description<
  <http://example.com/S>
      <http://example.com/p> 43 .
>
iex> RDF.graph({EX.S, EX.p, EX.O})
...> |> RDF.Graph.update(EX.S,
...>      fn description -> Description.add(description, {EX.p, EX.O2})
...>    end)
#RDF.Graph<name: nil
  <http://example.com/S>
      <http://example.com/p> <http://example.com/O>, <http://example.com/O2> .
>
```

The optional third argument allows to specify a default value which should be set in case no value to be updated exist for the given element.

```elixir
iex> RDF.description(EX.S) 
...> |> RDF.Description.update(EX.p, EX.O, fn _ -> EX.O2 end)
#RDF.Description<
  <http://example.com/S>
      <http://example.com/p> <http://example.com/O> .
>
```



## Accessing the content

All three RDF data structures implement the `Enumerable` protocol over the set of contained statements. In the case of `RDF.Description` and `RDF.Graph` as a set of triples and in case of `RDF.Dataset` as a set of quads. This means you can use all `Enum` functions over the contained statements as tuples.

```elixir
RDF.Description.new(EX.S1, {EX.p, [EX.O1, EX.O2]})
|> Enum.each(&IO.inspect/1)
```

The `RDF.Data` protocol offers various functions to access the contents of RDF data structures:

- `RDF.Data.subjects/1` returns the set of all subject resources
- `RDF.Data.predicates/1` returns the set of all used properties
- `RDF.Data.objects/1` returns the set of all resources on the object position of statements - literals not included
- `RDF.Data.resources/1` returns the set of all used resources at any position in the contained RDF statements
- `RDF.Data.description/2` returns all statements from a data structure about the given resource as a `RDF.Description`. It will be empty if no such statements exist. On a `RDF.Dataset` it will aggregate the statements about the resource from all graphs.
- `RDF.Data.descriptions/1` returns all `RDF.Description`s within a data structure (possible aggregated in the case of a `RDF.Dataset`)
- `RDF.Data.statements/1` returns a list of all contained RDF statements

The `get/3` functions return individual elements of a RDF data structure:

- `RDF.Description.get/3` returns the list of all object values for a given property
- `RDF.Graph.get/3` returns the `RDF.Description` for a given subject resource
- `RDF.Dataset.get/3` returns the `RDF.Graph` with the given graph name

All of these `get/3` functions return `nil` or the optionally given default value, when the given element cannot be found.

```elixir
iex> RDF.Description.new(EX.S1, init: {EX.p, [EX.O1, EX.O2]})
...> |> RDF.Description.get(EX.p)
[~I<http://example.com/O1>, ~I<http://example.com/O2>]

iex> RDF.Graph.new({EX.S1, EX.p, [EX.O1, EX.O2]})
...> |> RDF.Graph.get(EX.p2, :not_found)
:not_found
```

You can get a single object value for a given predicate in a `RDF.Description` with the `RDF.Description.first/2` function:

```elixir
iex> RDF.Description.new(EX.S1, init: {EX.p, EX.O1})
...> |> RDF.Description.first(EX.p)
~I<http://example.com/O1>
```

Since all three RDF data structures implement the `Access` behaviour, you can also use `data[key]` syntax, which basically just calls the respective `get` function.

```elixir
iex> description[EX.p]
[~I<http://example.com/O1>, ~I<http://example.com/O2>]

iex> graph[EX.p2] 
nil
```

Also, the familiar `fetch/2` function of the `Access` behaviour, as a variant of `get/3` which returns `ok` tuples, is available on all RDF data structures.

```elixir
iex> RDF.Description.new(EX.S1, init: {EX.p, [EX.O1, EX.O2]})
...> |> RDF.Description.fetch(EX.p)
{:ok, [~I<http://example.com/O1>, ~I<http://example.com/O2>]}

iex> RDF.Graph.new({EX.S1, EX.p, [EX.O1, EX.O2]})
...> |> RDF.Graph.fetch(EX.p2)
:error
```

`RDF.Dataset` also provides the following functions to access individual graphs:

- `RDF.Dataset.graphs/1` returns the list of all the graphs of the dataset
- `RDF.Dataset.default_graph/1` returns the default graph of the dataset
- `RDF.Dataset.graph/2` returns the graph of the dataset with the given name 


## Querying graphs

The SPARQL.ex package allows you to execute SPARQL queries against RDF.ex graphs. It's still very limited at the moment. See the [SPARQL.ex guide](/sparql-ex) for more information. But you can also do basic graph queries within RDF.ex directly with the `RDF.Graph.query/3` or `RDF.Graph.query_stream/3` functions.

These functions take a graph and a basic graph pattern (BGP) consisting of some RDF triples with variables, which are written as atoms ending with a question mark. The RDF triples with the variables can again provided in any of the forms for input data introduced above. This query for example returns all triples about resources which have a `rdfs:label "foo"`:

```elixir
RDF.Graph.query(graph, [
    {:s?, RDFS.label, "foo"},
    {:s?, :p?, :o?}
  ])
```

The results are returned in an `:ok` tuple (or directly with `RDF.Graph.query!/3`) as a list of solutions for the variables. The solutions are maps where the keys are the variables without the ending question mark.

```elixir
{:ok, [
  %{
    s: ~I<http://example.com/subject>,
    p: ~I<http://www.w3.org/2000/01/rdf-schema#label>,
    o: ~L"foo"
  },
  # ...
]}
```

Here's another example of a query pattern demonstrating one of the other forms and that also `RDF.PropertyMap`s can be used with the `:context` opt:

```elixir
RDF.Graph.query(graph, %{
  s?: %{
    p1: :o?,
    p2: [42, 3.14, true]
  },
  o?: %{p3: ["foo", "bar"]}
}, context: %{
  p1: EX.p1,
  p2: EX.p2,
  p3: EX.p3  
})
```

The `rdf:type` property can be written shortly with the atom `:a` and blank nodes can be written more shortly in the query pattern with atoms starting with an underscore.

::: tip
Blank nodes in query patterns have the interesting property to behave like variables which don't show up in the results. So they can be quite convenient for intermediary variables.
:::

```elixir
iex> RDF.Graph.query(graph, %{
...>   _s: %{
...>     :a => EX.Class,
...>     RDFS.label => :name?
...> }})
{:ok, [
  %{name: ~L"foo"},
  # ...
]}
```

If you want store a basic graph pattern query in a variable for reuse or want to build your own query builder function you can use the `RDF.Query.bgp/2` function. This function is used implicitly by `RDF.Graph.query/3` to build `RDF.Query.BGP` structs from lists (or tuples for single triple patterns).

```elixir
query = 
  RDF.Query.bgp %{
   s?: %{
     :a => EX.Class,
     RDFS.label => :name?
  }}

RDF.Graph.query(graph, query)
```

The `RDF.Query` module also offers another handy builder function: `RDF.Query.path/2` creates a basic graph pattern for a list representing a path through the graph.

```elixir
path = RDF.Query.path([EX.S, EX.p, RDFS.label, :name?])
RDF.Graph.query(graph, path)
```

This is similar to the following query:

```elixir
RDF.Graph.query(graph, [
    {EX.S, EX.p, :_o},
    {:_o, RDFS.label, :name?},
  ])
```

If you want the path builder function to generate variables (instead of blank nodes) for the path element objects in order to get them in the results, you can say so with the `with_elements: true` option.

Instead of executing the query to get the results directly, you can also request the results as a stream with the `RDF.Graph.query_stream/3` and `RDF.Graph.query_stream!/3` functions.


## Deleting statements

Statements can be deleted in two slightly different ways. One way is to use the `delete/3` function of the respective data structure. It accepts all forms for specifying statements as input introduced above and removes the found triples.

```elixir
iex> RDF.Description.new(EX.S1, init: {EX.p, [EX.O1, EX.O2]})
...> |> RDF.Description.delete({EX.S1, EX.p, EX.O1})
#RDF.Description<
  <http://example.com/S1>
      <http://example.com/p> <http://example.com/O2> .
>
```

Another way to delete statements is the `delete/3` function of the `RDF.Data` protocol. The only difference to `delete` functions on the data structures directly is how it handles the deletion of a `RDF.Description` from another `RDF.Description` or `RDF.Graph` from another `RDF.Graph`. While the dedicated RDF data structure function ignores the description subject or graph name and removes the statements even when they don't match, `RDF.Data.delete/3` only deletes when the description’s subject respective graph name matches.

```elixir
iex> RDF.Description.new(EX.S1, init: {EX.p, [EX.O1, EX.O2]})
...> |> RDF.Description.delete(RDF.Description.new(EX.S2, init: {EX.p, EX.O1}))
#RDF.Description<
  <http://example.com/S1>
      <http://example.com/p> <http://example.com/O2> .
>
iex> RDF.Description.new(EX.S1, init: {EX.p, [EX.O1, EX.O2]})
...> |> RDF.Data.delete(RDF.Description.new(EX.S2, init: {EX.p, EX.O1}))
#RDF.Description<
  <http://example.com/S1>
      <http://example.com/p> <http://example.com/O1>, <http://example.com/O2> .
>
```

Beyond that, there are:

- `RDF.Description.delete_predicates/2` which deletes all statements with the given property from a `RDF.Description`,
- `RDF.Graph.delete_subjects/2` which deletes all statements with the given subject resource from a `RDF.Graph`,
- `RDF.Dataset.delete_graph/2` which deletes all graphs with the given graph name from a `RDF.Dataset` and
- `RDF.Dataset.delete_default_graph/1` which deletes the default graph of a `RDF.Dataset`.


## Equality

RDF data structures can be compared for equality with the `equal?/2` function of the respective data structure. You should these instead of comparisons with `==`, because the data structures might contain fields which are not relevant for equality. For example the defined prefixes (see [here](/../rdf-ex/serializations) for more on that) are ignored for this comparison.

```elixir
iex> d = RDF.description(EX.S, init: {EX.p, EX.O})
iex> RDF.Description.equal?(d, d)
true
iex> RDF.Graph.equal?(
...>   RDF.graph(d, prefixes: %{ex: EX}), 
...>   RDF.graph(d, prefixes: %{ex: EX, xsd: XSD}))
true
...> RDF.graph(d, prefixes: %{ex: EX}) ==
...>   RDF.graph(d, prefixes: %{ex: EX, xsd: XSD}))
false
```

You can also compare different types of RDF data structures with the `RDF.Data.equal?/2` function, which takes just the raw data into account.

```elixir
iex> RDF.Data.equal?(d, RDF.graph(d))
true
```

As opposed to `RDF.Graph.equal?/2` the `RDF.Data.equal?/2` function also doesn't consider the graph name when comparing `RDF.Graph`s.

```elixir
iex> RDF.Graph.equal?(RDF.graph(d), RDF.graph(d, name: EX.Graph))
false
iex> RDF.Data.equal?(RDF.graph(d), RDF.graph(d, name: EX.Graph))
true
```
