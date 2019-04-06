# RDF data structures

RDF.ex provides various data structures for collections of statements:

- `RDF.Description`: a collection of triples about the same subject
- `RDF.Graph`: a named collection of statements
- `RDF.Dataset`:  a named collection of graphs, i.e. a collection of statements from different graphs; it may have multiple named graphs and at most one unnamed ("default") graph

All of these structures have similar sets of functions and implement Elixirs `Enumerable` and `Collectable` protocol, Elixirs `Access` behaviour and the `RDF.Data` protocol of RDF.ex.

The `new` function of these data structures create new instances of the struct and optionally initialize them with initial statements. `RDF.Description.new` requires at least an IRI or blank node for the subject, while `RDF.Graph.new` and `RDF.Dataset.new` take an optional IRI for the name of the graph or dataset via the `name` option.

```elixir
empty_description = RDF.Description.new(EX.Subject)

empty_unnamed_graph = RDF.Graph.new
empty_named_graph   = RDF.Graph.new(name: EX.Graph)

empty_unnamed_dataset = RDF.Dataset.new
empty_named_dataset   = RDF.Dataset.new(name: EX.Dataset)
```

As you can see, qualified terms from a vocabulary namespace can be given instead of an IRI and will be resolved automatically. This applies to all of the functions discussed below.

The `new` functions can be called more shortly with the resp. delegator functions `RDF.description`, `RDF.graph` and `RDF.dataset`.  

The `new` functions also take optional initial data, which can be provided in various forms. Basically it takes the given data and hands it to the `add` function with the newly created struct. 

## Adding statements

So let's look at these various forms of data the `add` function can handle. 

Firstly, they can handle single statements:

```elixir
description |> RDF.Description.add {EX.S, EX.p, EX.O}
graph       |> RDF.Graph.add {EX.S, EX.p, EX.O}
dataset     |> RDF.Dataset.add {EX.S, EX.p, EX.O, EX.Graph}
```

When the subject of a statement doesn't match the subject of the description, `RDF.Description.add` ignores it and is a no-op. 

`RDF.Description.add` also accepts a property-value pair as a tuple.

```elixir
RDF.Description.new(EX.S, {EX.p, EX.O1})
|> RDF.Description.add {EX.p, EX.O2}
```

In general, the object position of a statement can be a list of values, which will be interpreted as multiple statements with the same subject and predicate. So the former could be written more shortly:

```elixir
RDF.Description.new(EX.S, {EX.p, [EX.O1, EX.O2]})
```

Multiple statements with different subject and/or predicate can be given as a list of statements, where everything said before on single statements applies to the individual statements of these lists:

```elixir
description |> RDF.Description.add [{EX.p1, EX.O}, {EX.p2, [EX.O1, EX.O2]}
graph       |> RDF.Graph.add [{EX.S1, EX.p1, EX.o1}, {EX.S2, EX.p2, EX.o2}]
dataset     |> RDF.Dataset.add [{EX.S, EX.p, EX.o}, {EX.S, EX.p, EX.o, EX.Graph}
```

A `RDF.Description` can be added to any of the three data structures:

```elixir
input = RDF.Description.new(EX.S, {EX.p, EX.O1})
description |> RDF.Description.add input
graph       |> RDF.Graph.add input
dataset     |> RDF.Dataset.add input
```

Note that, unlike mismatches in the subjects of directly given statements, `RDF.Description.add` ignores the subject of a given `RDF.Description` and just adds the property-value pairs of the given description, because this is a common use case when merging the descriptions of differently named resources (eg. because they are linked via `owl:sameAs`).

`RDF.Graph.add` and `RDF.Dataset.add` can also add other graphs and `RDF.Dataset.add` can add the contents of another dataset.

`RDF.Dataset.add` is also special, in that it allows to overwrite the explicit or implicit graph context of the input data and redirect the input into another graph. For example, the following examples all add the given statements to the `EX.Other` graph:

```elixir
RDF.Dataset.new
|> RDF.Dataset.add({EX.S, EX.p, EX.O}, EX.Other)
|> RDF.Dataset.add[{EX.S, EX.p, EX.O1, nil}, {EX.S, EX.p, EX.O2, EX.Graph}], EX.Other)
|> RDF.Dataset.add(RDF.Graph.new({EX.S, EX.p, EX.O3}, name: EX.Graph), EX.Other)
```

Unlike the `add` function, which always returns the same data structure as the data structure to which the addition happens, which possible means ignoring some input statements (eg. when the subject of a statement doesn't match the description subject) or reinterpreting some parts of the input statement (eg. ignoring the subject of another description), the `merge` function of the `RDF.Data` protocol implemented by all three data structures will always add all of the input and possibly creates another type of data structure. For example, merging two `RDF.Description`s with different subjects results in a `RDF.Graph`. Or adding a quad to a `RDF.Graph` with a different name than the quad’s graph context results in a `RDF.Dataset`.

```elixir
RDF.Description.new(EX.S1, {EX.p, EX.O}) 
|> RDF.Data.merge(RDF.Description.new(EX.S2, {EX.p, EX.O})) # returns an unnamed RDF.Graph
|> RDF.Data.merge(RDF.Graph.new({EX.S2, EX.p, EX.O2}, name: EX.Graph)) # returns a RDF.Dataset
```

Statements added with `put` overwrite all existing statements with the same subject and predicate.

```elixir
iex> RDF.Graph.new({EX.S1, EX.p, EX.O1}) |> RDF.Graph.put({EX.S1, EX.p, EX.O2})
#RDF.Graph{name: nil
     ~I<http://example.com/S1>
         ~I<http://example.com/p>
             ~I<http://example.com/O2>}
```

It is available on all three data structures and can handle all of the input data types as their `add` counterpart.


## Accessing the content of RDF data structures

All three RDF data structures implement the `Enumerable` protocol over the set of contained statements. As a set of triples in the case of `RDF.Description` and `RDF.Graph` and as a set of quads in case of `RDF.Dataset`. This means you can use all `Enum` functions over the contained statements as tuples.

```elixir
RDF.Description.new(EX.S1, {EX.p, [EX.O1, EX.O2]})
|> Enum.each(&IO.inspect/1)
```

The `RDF.Data` protocol offers various functions to access the contents of RDF data structures:

- `RDF.Data.subjects/1` returns the set of all subject resources.
- `RDF.Data.predicates/1` returns the set of all used properties.
- `RDF.Data.objects/1` returns the set of all resources on the object position of statements. Note: Literals not included.
- `RDF.Data.resources/1` returns the set of all used resources at any position in the contained RDF statements.
- `RDF.Data.description/2` returns all statements from a data structure about the given resource as a `RDF.Description`. It will be empty if no such statements exist. On a `RDF.Dataset` it will aggregate the statements about the resource from all graphs.
- `RDF.Data.descriptions/1` returns all `RDF.Description`s within a data structure (possible aggregated in the case of a `RDF.Dataset`)
- `RDF.Data.statements/1` returns a list of all contained RDF statements.

The `get` functions return individual elements of a RDF data structure:

- `RDF.Description.get` returns the list of all object values for a given property.
- `RDF.Graph.get` returns the `RDF.Description` for a given subject resource.
- `RDF.Dataset.get` returns the `RDF.Graph` with the given graph name.

All of these `get` functions return `nil` or the optionally given default value, when the given element can not be found.

```elixir
iex> RDF.Description.new(EX.S1, {EX.p, [EX.O1, EX.O2]})
...> |> RDF.Description.get(EX.p)
[~I<http://example.com/O1>, ~I<http://example.com/O2>]

iex> RDF.Graph.new({EX.S1, EX.p, [EX.O1, EX.O2]})
...> |> RDF.Graph.get(EX.p2, :not_found)
:not_found
```

You can get a single object value for a given predicate in a `RDF.Description` with the `RDF.Description.first/2` function:

```elixir
iex> RDF.Description.new(EX.S1, {EX.p, EX.O1})
...> |> RDF.Description.first(EX.p)
~I<http://example.com/O1>
```

Since all three RDF data structures implement the `Access` behaviour, you can also use `data[key]` syntax, which basically just calls the resp. `get` function.

```elixir
iex> description[EX.p]
[~I<http://example.com/O1>, ~I<http://example.com/O2>]

iex> graph[EX.p2] 
nil
```

Also, the familiar `fetch` function of the `Access` behaviour, as a variant of `get` which returns `ok` tuples, is available on all RDF data structures.

```elixir
iex> RDF.Description.new(EX.S1, {EX.p, [EX.O1, EX.O2]})
...> |> RDF.Description.fetch(EX.p)
{:ok, [~I<http://example.com/O1>, ~I<http://example.com/O2>]}

iex> RDF.Graph.new({EX.S1, EX.p, [EX.O1, EX.O2]})
...> |> RDF.Graph.fetch(EX.p2)
:error
```

`RDF.Dataset` also provides the following functions to access individual graphs:

- `RDF.Dataset.graphs` returns the list of all the graphs of the dataset
- `RDF.Dataset.default_graph` returns the default graph of the dataset
- `RDF.Dataset.graph` returns the graph of the dataset with the given name 


## Querying graphs with the SPARQL query language

The [SPARQL.ex](/sparql-ex) package allows you to execute SPARQL queries against RDF.ex data structures. It's still very limited at the moment. It just supports `SELECT` queries with basic graph pattern matching, filtering and projection and works on `RDF.Graph`s only. But even in this early, limited form it allows to express more powerful queries in a simpler way than with the plain `RDF.Graph` API.

See the [SPARQL.ex guide](/sparql-ex) for more information and some examples.


## Deleting statements

Statements can be deleted in two slightly different ways. One way is to use the `delete` function of the resp. data structure. It accepts all the supported ways for specifying collections of statements supported by the resp. `add` counterparts and removes the found triples.

```elixir
iex> RDF.Description.new(EX.S1, {EX.p, [EX.O1, EX.O2]})
...> |> RDF.Description.delete({EX.S1, EX.p, EX.O1})
#RDF.Description{subject: ~I<http://example.com/S1>
     ~I<http://example.com/p>
         ~I<http://example.com/O2>}
```

Another way to delete statements is the `delete` function of the `RDF.Data` protocol. The only difference to `delete` functions on the data structures directly is how it handles the deletion of a `RDF.Description` from another `RDF.Description` or `RDF.Graph` from another `RDF.Graph`. While the dedicated RDF data structure function ignores the description subject or graph name and removes the statements even when they don't match, `RDF.Data.delete` only deletes when the description’s subject resp. graph name matches.

```elixir
iex> RDF.Description.new(EX.S1, {EX.p, [EX.O1, EX.O2]})
...> |> RDF.Description.delete(RDF.Description.new(EX.S2, {EX.p, EX.O1}))
#RDF.Description{subject: ~I<http://example.com/S1>
     ~I<http://example.com/p>
         ~I<http://example.com/O2>}

iex> RDF.Description.new(EX.S1, {EX.p, [EX.O1, EX.O2]})
...> |> RDF.Data.delete(RDF.Description.new(EX.S2, {EX.p, EX.O1}))
#RDF.Description{subject: ~I<http://example.com/S1>
     ~I<http://example.com/p>
         ~I<http://example.com/O1>
         ~I<http://example.com/O2>}
```

Beyond that, there is 

- `RDF.Description.delete_predicates` which deletes all statements with the given property from a `RDF.Description`,
- `RDF.Graph.delete_subjects` which deletes all statements with the given subject resource from a `RDF.Graph`,
- `RDF.Dataset.delete_graph` which deletes all graphs with the given graph name from a `RDF.Dataset` and
- `RDF.Dataset.delete_default_graph` which deletes the default graph of a `RDF.Dataset`.


## Equality

RDF data structures can be compared for equality with the `equal?/2` function of the respective data structure. You should these instead of comparisons with `==`, because the data structures might contain fields which are not relevant for equality. For example the defined prefixes (see [here](/../rdf-ex/serializations) for more on that) are ignored for this comparison.

```elixir
iex> d = RDF.description(EX.S, EX.p, EX.O)
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
