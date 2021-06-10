# Lists

RDF lists can be represented with the `RDF.List` structure.

An existing `RDF.List` in a given graph can be created with `RDF.List.new` or its alias `RDF.list`, passing it the head node of a list and the graph containing the statements constituting the list.

```elixir
graph = 
  Graph.new(
       ~B<Foo>
       |> RDF.first(1)
       |> RDF.rest(EX.Foo))
    |> Graph.add(
       EX.Foo
       |> RDF.first(2)
       |> RDF.rest(RDF.nil))

list = RDF.List.new(~B<Foo>, graph)
```

If the given head node does not refer to a well-formed RDF list in the graph, `nil` is returned.

An entirely new `RDF.List` can be created with `RDF.List.from` or `RDF.list` and a native Elixir list or an Elixir `Enumerable` with values of all types that are allowed for objects of statements (including nested lists). 

```elixir
list = RDF.list(["foo", EX.bar, ~B<bar>, [1, 2, 3]])
```
If you want to add the graph statements to an existing graph, you can do that via the `graph` option.

```elixir
existing_graph = RDF.Graph.new({EX.S, EX.p, EX.O})
RDF.list([1, 2, 3], graph: existing_graph)
```

The `head` option also allows to specify a custom node for the head of the list.

The function `RDF.List.values/1` allows to get the values of a RDF list (including nested lists) as a native Elixir list.

```elixir
iex> RDF.list(["foo", EX.Bar, ~B<bar>, [1, 2]]) |> RDF.List.values
[~L"foo", ~I<http://www.example.com/ns/Bar>, ~B<bar>,
 [%RDF.Literal{value: 1, datatype: ~I<http://www.w3.org/2001/XMLSchema#integer>},
  %RDF.Literal{value: 2, datatype: ~I<http://www.w3.org/2001/XMLSchema#integer>}]]
```
