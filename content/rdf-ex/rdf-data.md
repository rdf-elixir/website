# RDF.Data

While the previous chapter introduced the individual RDF data structures and their specific functions, the `RDF.Data` module provides a unified API for working with all of them polymorphically. This follows Elixir's Enumerable/Enum pattern: the `RDF.Data.Source` protocol defines minimal primitives that data structures implement, while the `RDF.Data` module builds a rich user API on top.

This separation means you can write code that works uniformly across `RDF.Description`, `RDF.Graph`, and `RDF.Dataset` - and even custom implementations.


## Iteration

The `RDF.Data` module provides several ways to iterate over statements. The most fundamental is `reduce/3`:

```elixir
iex> graph = RDF.graph([{EX.S1, EX.p, EX.O1}, {EX.S2, EX.p, EX.O2}])
iex> RDF.Data.reduce(graph, 0, fn _statement, acc -> acc + 1 end)
2
```

For early termination, use `reduce_while/3`:

```elixir
iex> RDF.Data.reduce_while(graph, nil, fn
...>   {subject, _, _}, _ -> {:halt, subject}
...>   _, acc -> {:cont, acc}
...> end)
~I<http://example.com/S1>
```

When you just need side effects, `each/2` is more convenient:

```elixir
RDF.Data.each(graph, &IO.inspect/1)
```


## Transformation

Statements can be transformed with `map/2`:

```elixir
iex> desc = EX.S |> EX.p([EX.O1, EX.O2])
iex> RDF.Data.map(desc, fn {s, p, _o} -> {s, p, EX.NewObject} end)
#RDF.Description<
  <http://example.com/S>
      <http://example.com/p> <http://example.com/NewObject> .
>
```

For filtering, `filter/2` and `reject/2` work as expected:

```elixir
iex> graph = RDF.graph([
...>   {EX.S, EX.important, EX.O1},
...>   {EX.S, EX.unimportant, EX.O2}
...> ])
iex> RDF.Data.filter(graph, fn {_, p, _} -> p == EX.important() end)
#RDF.Graph<name: nil
  <http://example.com/S>
      <http://example.com/important> <http://example.com/O1> .
>
```

The `take/2` function returns the first N statements:

```elixir
RDF.Data.take(large_graph, 10)
```


## Navigating Structures

Functions like `description/2,3`, `descriptions/1`, `graph/2,3`, `graphs/1`, `default_graph/1` and `graph_names/1` work on all RDF data structures. For this, an `RDF.Description` is interpreted as an unnamed graph containing exactly its statements.

```elixir
iex> graph = RDF.graph([
...>   {EX.Alice, EX.name, "Alice"},
...>   {EX.Bob, EX.name, "Bob"}
...> ])
iex> RDF.Data.description(graph, EX.Alice)
#RDF.Description<subject: ~I<http://example.com/Alice>
  <http://example.com/Alice>                                                                                                       
      <http://example.com/name> "Alice" .                                                                                          
>

iex> RDF.Data.description(graph, EX.Unknown)
RDF.Description.new(EX.Unknown)

iex> RDF.Data.description(graph, EX.Unknown, nil)
nil

iex> RDF.Data.descriptions(graph)
[#RDF.Description<...>, #RDF.Description<...>]
```

On a `RDF.Dataset`, `description/2` and `descriptions/1` aggregate statements about each subject from all graphs.


## Extracting Statements

The `statements/1` function returns all statements as a list - triples for descriptions and graphs, quads for datasets:

```elixir
iex> RDF.Data.statements(desc)
[{~I<http://example.com/S>, ~I<http://example.com/p>, ~I<http://example.com/O>}]
```

You can also explicitly request triples or quads:

```elixir
# drops graph component
RDF.Data.triples(dataset)

# adds graph name (nil for unnamed)
RDF.Data.quads(graph)       
```


## Aggregation Functions

To get all unique subjects, predicates, or objects:

```elixir
iex> RDF.Data.subjects(graph)
[~I<http://example.com/S1>, ~I<http://example.com/S2>]

iex> RDF.Data.predicates(graph)
[~I<http://example.com/p>]

iex> RDF.Data.objects(graph)  # all object terms including literals
```

All of these support a `/2` variant with a filter function:

```elixir
iex> RDF.Data.subjects(graph, &is_rdf_iri/1)  # only IRIs
iex> RDF.Data.objects(graph, &RDF.literal?/1)  # only literals
```

For objects, `object_resources/1` returns only IRIs and blank nodes:

```elixir
iex> graph = RDF.graph([
...>   {EX.S, EX.link, EX.Other},
...>   {EX.S, EX.name, "Alice"}
...> ])
iex> RDF.Data.object_resources(graph)
[~I<http://example.com/Other>]

iex> RDF.Data.objects(graph)
[~L"Alice", ~I<http://example.com/Other>]
```

The `resources/1,2` function returns all subjects and object resources (not literals):

```elixir
iex> RDF.Data.resources(graph)

# To include predicates as well:
iex> RDF.Data.resources(graph, predicates: true)
```

With a filter function, you can filter by term type or position:

```elixir
# Only IRIs (1-arity filter)
iex> RDF.Data.resources(graph, &is_rdf_iri/1)

# Filter by position (2-arity filter receives term and :subject/:predicate/:object)
iex> RDF.Data.resources(graph, fn _term, position -> position == :subject end)

# Combined with predicates option
iex> RDF.Data.resources(graph, predicates: true, filter: fn term, _pos -> is_rdf_iri(term) end)
```


## Counting and Emptiness

Several counting functions are available:

```elixir
iex> graph = RDF.graph([
...>   {EX.S1, EX.p1, EX.O1},
...>   {EX.S1, EX.p2, EX.O2},
...>   {EX.S2, EX.p1, EX.O3}
...> ])
iex> RDF.Data.statement_count(graph)
3
iex> RDF.Data.subject_count(graph)
2
iex> RDF.Data.predicate_count(graph)
2
```

The `count/1` function returns the count of the primary element for each structure type - predicates for descriptions, subjects for graphs, and graphs for datasets:

```elixir
iex> RDF.Data.count(description)  # predicate count
iex> RDF.Data.count(graph)        # subject count
iex> RDF.Data.count(dataset)      # graph count
```

To check if a structure is empty:

```elixir
iex> RDF.Data.empty?(RDF.graph())
true
```


## Inclusion Checks

The `include?/2` function checks whether statements are contained in a data structure:

```elixir
# works with statement tuples
RDF.Data.include?(graph, {EX.S, EX.p, EX.O})

# other RDF.Data.Sources
RDF.Data.include?(graph, EX.S |> EX.p(EX.O))

# or lists of each of these 
RDF.Data.include?(graph, [{EX.S1, EX.p, EX.O1}, {EX.S2, EX.p, EX.O2}])
```

For datasets, triple patterns match against any graph, while quad patterns check a specific graph:

```elixir
# checks any graph
RDF.Data.include?(dataset, {EX.S, EX.p, EX.O})

# checks a specific graph
RDF.Data.include?(dataset, {EX.S, EX.p, EX.O, EX.G})
```

To check if a structure contains any statements about a subject, `describes?/2` can be used:

```elixir
RDF.Data.describes?(graph, EX.Alice)
```


## Equality

The `equal?/2` function compares data structures based on their statements, working across structure types:

```elixir
iex> desc = EX.S |> EX.p(EX.O)
iex> graph = RDF.graph([{EX.S, EX.p, EX.O}])
iex> RDF.Data.equal?(desc, graph)
true
```

Empty structures are always equal:

```elixir
iex> RDF.Data.equal?(RDF.description(EX.S), RDF.graph())
true
```


## Merging and Deleting

The `merge/2` function combines data structures and automatically promotes to a larger structure type when necessary:

```elixir
# Same subject → stays Description
iex> desc1 = EX.S |> EX.p1(EX.O1)
iex> desc2 = EX.S |> EX.p2(EX.O2)
iex> RDF.Data.merge(desc1, desc2)
#RDF.Description<...>

# Different subjects → promotes to Graph
iex> desc1 = EX.S1 |> EX.p(EX.O)
iex> desc2 = EX.S2 |> EX.p(EX.O)
iex> RDF.Data.merge(desc1, desc2)
#RDF.Graph<...>

# Different graph names → promotes to Dataset
iex> graph1 = RDF.graph({EX.S, EX.p, EX.O}, name: EX.G1)
iex> graph2 = RDF.graph({EX.S, EX.p, EX.O}, name: EX.G2)
iex> RDF.Data.merge(graph1, graph2)
#RDF.Dataset<...>
```

The `delete/2` function removes statements:

```elixir
RDF.Data.delete(graph, {EX.S, EX.p, EX.O})
RDF.Data.delete(graph, [{EX.S1, EX.p, EX.O1}, {EX.S2, EX.p, EX.O2}])
RDF.Data.delete(graph, another_graph)
```

Note that `RDF.Data.delete/2` behaves differently from the structure-specific `delete/3` functions when deleting descriptions or graphs: it only deletes when the subject or graph name matches.

```elixir
iex> desc = RDF.description(EX.S, init: {EX.p, EX.O})
iex> other = RDF.description(EX.Other, init: {EX.p, EX.O})

# Structure-specific: ignores subject mismatch, deletes matching predicate-objects
iex> RDF.Description.delete(desc, other)
#RDF.Description<subject: ~I<http://example.com/S>>

# RDF.Data: respects subject, no deletion happens
iex> RDF.Data.delete(desc, other)
#RDF.Description<subject: ~I<http://example.com/S>
  <http://example.com/S>
      <http://example.com/p> <http://example.com/O> .
>
```

The `pop/1` function removes and returns a single statement:

```elixir
{statement, remaining} = RDF.Data.pop(graph)
```

For empty structures, `pop/1` returns `{nil, data}`.


## Type Conversion

To convert between structure types:

```elixir
RDF.Data.to_graph(description)
RDF.Data.to_graph(dataset)  # merges all graphs, loses graph names

RDF.Data.to_dataset(description)
RDF.Data.to_dataset(graph)  # preserves graph name
```

When working with custom `RDF.Data.Source` implementations, use the `:native` option to ensure native RDF.ex structures:

```elixir
RDF.Data.to_graph(custom_source, native: true)
```


## Implementing RDF.Data.Source

If you want to create custom RDF data sources, you need to implement the `RDF.Data.Source` protocol.

The protocol defines several functions:

- `structure_type/1` - Returns `:description`, `:graph`, or `:dataset`
- `derive/3` - Creates empty structures of a given type (see below)
- `reduce/3` - Fundamental iteration over statements, following the `Enumerable` reducer pattern
- `description/2`, `graph/2` - Structure access
- `subject/1`, `graph_name/1` - Property access for single-subject/single-graph structures
- `subjects/1`, `graph_names/1` - Aggregation functions
- `statement_count/1`, `description_count/1`, `graph_count/1` - Counting functions
- `add/2`, `delete/2` - Statement addition and removal

The `derive/3` function derives an empty structure of a desired type from a template. It serves two purposes:

1. **System preservation**: Custom implementations can return their own corresponding structures, keeping operations within the same system.
2. **Metadata inheritance**: When `preserve_metadata: true` (default), relevant metadata (e.g. prefixes) from the template is copied to the new structure.

`RDF.Data` functions that create new structures (like `merge/2`, `map/2`, `filter/2`) call this function to determine the appropriate target type.

For various functions, you can return `{:error, __MODULE__}` to signal that no efficient implementation exists. The `RDF.Data` module will then use a generic fallback implementation based on `reduce/3`.
This allows implementations to only optimize operations where they can provide significant performance improvements.

Here's a complete implementation for a custom graph-like structure:

```elixir
defmodule MyApp.CustomGraph do
  defstruct [:triples]
end

defimpl RDF.Data.Source, for: MyApp.CustomGraph do
  def structure_type(_), do: :graph

  # Follows the Enumerable reducer pattern: must handle :cont, :halt, and return :done/:halted
  def reduce(%{triples: triples}, acc, fun) do
    do_reduce(triples, acc, fun)
  end

  defp do_reduce([], {:cont, acc}, _fun), do: {:done, acc}
  defp do_reduce(_, {:halt, acc}, _fun), do: {:halted, acc}
  defp do_reduce([triple | rest], {:cont, acc}, fun) do
    do_reduce(rest, fun.(triple, acc), fun)
  end

  # nil because a graph has multiple subjects, not a single one
  def subject(_), do: nil
  # nil because this is an unnamed graph (no graph IRI)
  def graph_name(_), do: nil

  # Derives an empty structure of the desired type, preserving metadata where applicable.
  # For :description, the subject must be provided via opts since a graph has no single subject.
  def derive(_, :description, opts) do
    case Keyword.fetch(opts, :subject) do
      {:ok, subject} -> {:ok, RDF.Description.new(subject)}
      :error -> {:error, :no_subject}
    end
  end
  # For :graph, return an empty copy of the same custom struct to stay in the same system
  def derive(data, :graph, _opts), do: {:ok, %{data | triples: []}}
  def derive(_, :dataset, _opts), do: {:ok, RDF.Dataset.new()}

  # Returns :error when no statements exist for the given subject
  def description(%{triples: triples}, subject) do
    matching = Enum.filter(triples, fn {s, _, _} -> s == subject end)
    if matching == [], do: :error, else: {:ok, RDF.description(subject, init: matching)}
  end
  # An unnamed graph only matches graph name nil; any other name returns :error
  def graph(data, nil), do: {:ok, data}
  def graph(_, _), do: :error

  # A single unnamed graph has exactly one graph name: nil (the default/unnamed graph)
  def graph_names(_), do: {:ok, [nil]}
  # {:error, __MODULE__} signals RDF.Data to use the generic fallback based on reduce/3
  def subjects(_), do: {:error, __MODULE__}

  def statement_count(%{triples: triples}), do: {:ok, length(triples)}
  # Falls back to generic counting via reduce/3
  def description_count(_), do: {:error, __MODULE__}
  # A single graph structure always contains exactly one graph
  def graph_count(_), do: {:ok, 1}

  # Falls back to generic add/delete via reduce/3 (read-only implementation)
  def add(_, _), do: {:error, __MODULE__}
  def delete(_, _), do: {:error, __MODULE__}
end
```

See the `RDF.Data.Source` protocol documentation for complete type specifications.
