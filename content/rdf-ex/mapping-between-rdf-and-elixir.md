# Mapping of RDF terms and structures

::: tip

If you're looking for a way to map `RDF.Graph`s or `RDF.Description`s to Elixir structs, you might be interested in [Grax](/grax/).

:::

The `RDF.Term.value/1` function converts RDF terms to Elixir values:

```elixir
iex> RDF.Term.value(~I<http://example.com/>)
"http://example.com/"
iex> RDF.Term.value(~L"foo")
"foo"
iex> RDF.integer(42) |> RDF.Term.value()
42
```

It returns `nil` if no conversion is possible.

All structures of RDF terms also support a `values/2` function. The `values/2` functions on `RDF.Triple`, `RDF.Quad` and `RDF.Statement` are converting a tuple of RDF terms to a tuple of the resp. Elixir values. On all of the other RDF data structures (`RDF.Description`, `RDF.Graph` and `RDF.Dataset`) and the general `RDF.Data` protocol the `values/2` functions are producing a map of the converted Elixir values.

```elixir
iex> RDF.Triple.values {~I<http://example.com/S>, ~I<http://example.com/p>, RDF.literal(42)}
{"http://example.com/S", "http://example.com/p", 42}

iex> {~I<http://example.com/S>, ~I<http://example.com/p>, ~L"Foo"}
...> |> RDF.Description.new()
...> |> RDF.Description.values()
%{"http://example.com/p" => ["Foo"]}

iex> [
...>   {~I<http://example.com/S1>, ~I<http://example.com/p>, ~L"Foo"},
...>   {~I<http://example.com/S2>, ~I<http://example.com/p>, RDF.integer(42)}
...> ]
...> |> RDF.Graph.new()
...> |> RDF.Graph.values()
%{
  "http://example.com/S1" => %{"http://example.com/p" => ["Foo"]},
  "http://example.com/S2" => %{"http://example.com/p" => [42]}
}

iex> [
...>   {~I<http://example.com/S>, ~I<http://example.com/p>, ~L"Foo", ~I<http://example.com/Graph>},
...>   {~I<http://example.com/S>, ~I<http://example.com/p>, RDF.integer(42), }
...> ]
...> |> RDF.Dataset.new()
...> |> RDF.Dataset.values()
%{
  "http://example.com/Graph" => %{
    "http://example.com/S" => %{"http://example.com/p" => ["Foo"]}
  },
  nil => %{
    "http://example.com/S" => %{"http://example.com/p" => [42]}
  }
}
```

All of these `values` functions also support the `:context` opt where a `RDF.PropertyMap` or anything from which a `RDF.PropertyMap` can be created from (introduced [here](/rdf-ex/data-structures.html#input-forms)) can be provided. The term atoms for the properties in the PropertyMap will then be used as the mapped predicates.

```elixir
iex> {~I<http://example.com/S>, ~I<http://example.com/p>, ~L"Foo"}
...> |> RDF.Description.new()
...> |> RDF.Description.values(p: ~I<http://example.com/p>)
%{p: ["Foo"]}
```

If you want control the mapping of the values, you can use the  `map/2` function available on all RDF datastructures, which applys a custom function for the terms of the statement when mapping the RDF data structures to maps.
The function will be called with a tuple `{statement_position, rdf_term}` where `statement_position` is one of the atoms `:subject`, `:predicate`, `:object` or `:graph_name`, while `rdf_term` is the RDF term to be mapped.

```elixir
iex> [
...>   {~I<http://example.com/S1>, ~I<http://example.com/p>, ~L"Foo"},
...>   {~I<http://example.com/S2>, ~I<http://example.com/p>, RDF.integer(42)}
...> ]
...> |> RDF.Graph.new()
...> |> RDF.Graph.map(fn 
...>      {:predicate, predicate} ->
...>        predicate 
...>        |> to_string() 
...>        |> String.split("/") 
...>        |> List.last() 
...>        |> String.to_atom()
...>    {_, term} ->
...>      RDF.Term.value(term)
...>    end)
%{
  "http://example.com/S1" => %{p: ["Foo"]},
  "http://example.com/S2" => %{p: [42]}
}
```

