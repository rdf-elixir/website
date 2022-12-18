# Installation

The [RDF.ex Hex package](https://hex.pm/packages/rdf) can be installed as usual, by adding `rdf` to your list of dependencies in `mix.exs`:

```elixir
def deps do
  [
    {:rdf, "~> 1.1"}
  ]
end
```

If you want to read or write [JSON-LD](http://www.w3.org/TR/json-ld/), you also have to add `json_ld` to your dependencies for the separate [JSON-LD.ex](https://hex.pm/packages/json_ld) package. 
If you want to read or write [RDF-XML](http://www.w3.org/TR/rdf-syntax-grammar/), you have to add `rdf_xml` to your dependencies for the separate [RDF-XML.ex](https://hex.pm/packages/rdf_xml) package.

```elixir
def deps do
  [
    {:rdf, "~> 1.1"},
    {:rdf_xml, "~> 1.0"},
    {:json_ld, "~> 0.3"},
  ]
end
```
