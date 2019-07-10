# Extension functions

The SPARQL query language has a specified way for the introduction of custom [extension functions](https://www.w3.org/TR/sparql11-query/#extensionFunctions). An extension function for a function with the name `http://example.com/fun` can be defined in SPARQL.ex like this:

```elixir
defmodule ExampleFunction do
  use SPARQL.ExtensionFunction, name: "http://example.com/fun"

  def call(distinct, arguments, _, execution) do
    # your implementation
  end
end
```

The name of the module is arbitrary and has no further meaning. The first argument `distinct` is a boolean flag telling, if the function was called with the `DISTINCT` keyword, which is syntactically allowed in custom aggregate function calls only. The `arguments` argument is the list of already evaluated RDF terms with which the extension function was called in the SPARQL query. The ignored third argument contains the currently evaluated solution and some other internal information and shouldn't be relied upon. Since the arguments are already evaluated against the current solution, this shouldn't be necessary anyway. The `execution` argument is a map with some global query execution context information. In particular:

- `base`: the base IRI
- `time`: the query execution time
- `bnode_generator`: the name of the `RDF.BlankNode.Generator` (see [RDF.ex documentation](http://hexdocs.pm/rdf)) used to generate unique blank nodes consistently

::: danger
Note that extension functions can of course only be used with queries run against RDF.ex data. For external SPARQL endpoints you'll have to live with the extension functions available on the underlying query engine used to run the SPARQL endpoint.
:::
