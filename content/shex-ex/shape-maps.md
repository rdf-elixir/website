# ShapeMaps

In order to apply a ShEx schema to your RDF data, you'll have to provide a so called ShapeMap, which is a set of associations of nodes to shapes of the schema to which they must conform to be valid.

You can create a ShapeMap with the  `ShEx.shape_map/1` function and provide the respective associations.

```elixir
ShEx.shape_map(%{~I<http://example.com/nodeA> => ~I<http://example.com/Shape>})
```

The start shape of a schema can referenced with the atom `:start`.

```elixir
ShEx.shape_map(%{~I<http://example.com/nodeB> => :start})
```

When nodes and shape identifiers are given as native Elixir values they will be coerced to respective RDF terms. This also includes terms of an [RDF vocabulary namespace](/../rdf-ex/namespaces).

```elixir
ShEx.shape_map(%{"http://example.com/nodeA" => EX.Shape})
```

You can also feed in a ShapeMap in the [ShapeMap language](https://shexspec.github.io/shape-map/).

```elixir
ShEx.ShapeMap.decode """
    <http://example.com/nodeA> @ <http://example.com/Shape>,
    <http://example.com/nodeB> @ START
    ""
```

The ShapeMaps above were all fixed ShapeMaps, which specify the nodes directly.
Query ShapeMaps allow to provide triple patterns to query the nodes which should conform a certain shape. A triple pattern in a ShEx ShapeMap is a triple with the atom `:focus` on subject or object position.

```elixir
ShEx.shape_map(%{
  {:focus, ~I<http://example.com/p>, ~I<http://example.com/O>} 
    => ~I<http://example.com/Shape1>,
  {~I<http://example.com/S>, ~I<http://example.com/p>, :focus} 
    => ~I<http://example.com/Shape2>
})
```

Additionally, the atom `:_` can also be used on subject or object position as a wildcard.

```elixir
ShEx.shape_map(%{
  {:focus, ~I<http://example.com/p>, :_}  => ~I<http://example.com/Shape1>,
  {:_, ~I<http://example.com/p>, :focus}  => ~I<http://example.com/Shape2>
})
```

A query ShapeMap is implicitly converted to a fixed ShapeMap before a validation. You can also do this on your own with the `ShEx.Shape.to_fixed/2` function.

ShapeMaps are also used for storing the results of a validation, which will be described in the next section.

You can always determine the type of a ShapeMap with the `type` field.

```elixir
shape_map = ShEx.shape_map(%{{:focus, ~I<http://example.com/p>, :_} => :start})
shape_map.type  # => :query
```

`ShEx.ShapeMap` implements the `Enumerable` protocol over the set of association, so you can use it with all of the `Enum` functions.
