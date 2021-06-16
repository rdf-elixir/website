# Installation

The [RDF.ex Hex package](https://hex.pm/packages/rdf) can be installed as usual, by adding `rdf` to your list of dependencies in `mix.exs`:

```elixir
def deps do
  [
    {:rdf, "~> 0.9"}
  ]
end
```

If you want to read or write [JSON-LD](http://www.w3.org/TR/json-ld/), you also have to add `json_ld` to your dependencies for the separate [JSON-LD.ex](https://hex.pm/packages/json_ld) package. 
If you want to read or write [RDF-XML](http://www.w3.org/TR/rdf-syntax-grammar/), you have to add `rdf_xml` to your dependencies for the separate [RDF-XML.ex](https://hex.pm/packages/rdf_xml) package.

```elixir
def deps do
  [
    {:rdf, "~> 0.9"},
    {:rdf_xml, "~> 0.1"},
    {:json_ld, "~> 0.3"},
  ]
end
```

Since RDF.ex uses the [ProtocolEx](https://github.com/OvermindDL1/protocol_ex) library under the hood, you'll have to add its compiler in `mix.exs` (after the built-in elixir compiler):

```elixir
def project do
  [
    # ...
    compilers: Mix.compilers ++ [:protocol_ex],
    # ...
  ]
end
```

::: warning

If you're a library developer building something on top of RDF.ex, you should add the same note in your installation instructions, since the compiler configuration is not inherited from dependencies.

You can read about the details why RDF.ex needs this library [here](https://marcelotto.medium.com/the-walled-gardens-within-elixir-d0507a568015).

:::
