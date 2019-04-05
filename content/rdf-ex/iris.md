# IRIs

RDF.ex follows the RDF specs and supports [IRIs](https://en.wikipedia.org/wiki/Internationalized_Resource_Identifier), an internationalized generalization of URIs, permitting a wider range of Unicode characters. They are represented with the `RDF.IRI` structure and can be constructed either with `RDF.IRI.new/1` or `RDF.IRI.new!/1`, the latter of which additionally validates, that the given IRI is actually a valid absolute IRI or raises an exception otherwise.

```elixir
RDF.IRI.new("http://www.example.com/foo")
RDF.IRI.new!("http://www.example.com/foo")
```

The `RDF` module defines the alias functions `RDF.iri/1` and `RDF.iri!/1` delegating to the resp. `new` function:

```elixir
RDF.iri("http://www.example.com/foo")
RDF.iri!("http://www.example.com/foo")
```

Besides being a little shorter than `RDF.IRI.new` and better `import`able, their usage will automatically benefit from any future IRI creation optimizations and is therefore recommended over the original functions.

A literal IRI can also be written with the `~I` sigil:

```elixir
~I<http://www.example.com/foo>
```

But there's an even shorter notation for IRI literals.
