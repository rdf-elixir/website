# Statements

RDF statements are generally represented in RDF.ex as native Elixir tuples, either as 3-element tuples for triples or as 4-element tuples for quads.

The `RDF.Triple` and `RDF.Quad` modules both provide a function `new` for such tuples, which coerces the elements to proper nodes when possible or raises an error when such a coercion is not possible. In particular these functions also resolve qualified terms from a vocabulary namespace. They can also be called with the alias functions `RDF.triple` and `RDF.quad`.

```elixir
iex> RDF.triple(EX.S, EX.p, 1)
{~I<http://example.com/S>, ~I<http://example.com/p>, RDF.integer(1)}

iex> RDF.triple {EX.S, EX.p, 1}
{~I<http://example.com/S>, ~I<http://example.com/p>, RDF.integer(1)}

iex> RDF.quad(EX.S, EX.p, 1, EX.Graph)
{~I<http://example.com/S>, ~I<http://example.com/p>, RDF.integer(1),
 ~I<http://example.com/Graph>}

iex> RDF.triple {EX.S, 1, EX.O}
** (RDF.Triple.InvalidPredicateError) '1' is not a valid predicate of a RDF.Triple
    (rdf) lib/rdf/statement.ex:53: RDF.Statement.coerce_predicate/1
    (rdf) lib/rdf/triple.ex:26: RDF.Triple.new/3
```

If you want to explicitly create a quad in the default graph context, you can use `nil` as the graph name. The `nil` value is used consistently as the name of the default graph within RDF.ex.

```elixir
iex> RDF.quad(EX.S, EX.p, 1, nil)
{~I<http://example.com/S>, ~I<http://example.com/p>, RDF.integer(1), nil}
```

