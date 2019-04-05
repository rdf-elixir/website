# Serializations

The RDF.ex package comes with implementations of the [N-Triples](https://www.w3.org/TR/n-triples/), [N-Quads](https://www.w3.org/TR/n-quads/) and [Turtle](https://www.w3.org/TR/turtle/) serialization formats. 
Formats which require additional dependencies should be implemented in separate Hex packages.
The [JSON-LD](http://www.w3.org/TR/json-ld/) format for example is available with the [JSON-LD.ex](https://hex.pm/packages/json_ld) package.

RDF graphs and datasets can be read and written to files or strings in a RDF serialization format using the  `read_file`, `read_string` and `write_file`, `write_string` functions of the resp. `RDF.Serialization.Format` module.

```elixir
{:ok, graph} = RDF.NTriples.read_file("/path/to/some_file.nt")
{:ok, nquad_string} = RDF.NQuads.write_string(graph)
```

All of the read and write functions are also available in bang variants which will fail in error cases.

All of these `read_*` and `write_*` functions are also available in the top-level `RDF` module, where the serialization format can be specified in various ways, either by providing the format name via the `format` option, or via the `media_type` option. 

```elixir
{:ok, graph} = RDF.read_file("/path/to/some_file", format: :turtle)
json_ld_string = RDF.write_string!(graph, media_type: "application/ld+json")
```

Note: The later command requires the `json_ld` package to be defined as a dependency in the Mixfile of your application.

The file read and write functions are also able to infer the format from the file extension of the given filename.

```elixir
RDF.read_file!("/path/to/some_file.ttl")
|> RDF.write_file!("/path/to/some_file.jsonld")
```

## Base IRI

For serialization formats which support it, you can provide a base IRI on the read functions with the `base` option. You can also provide a default base IRI in your application configuration, which will be used when no `base` option is given.

```elixir
config :rdf,
  default_base_iri: "http://my_app.example/"
```

## Managing prefixes

The prefixes used in serialization formats which support this can be managed in various ways. 

An `RDF.Graph` contains a mapping of prefixes to IRI namespaces.
You can add prefixes with `RDF.Graph.add_prefixes/2`. 
The mapping can given as a map or keyword lists, where the prefixes might be given as atoms or strings, while the IRI namespaces can be given as `RDF.IRI`s, strings or as `RDF.Vocabulary.Namespace` modules. You can use any combinations of these different types, prefixes are stored internally always as atoms and IRI namespaces always as `RDF.IRI`s.

```elixir
graph
|> RDF.Graph.add_prefixes(ex: EX, schema: ~I<http://schema.org/>)
|> RDF.Graph.add_prefixes(%{"ex2" => "http://example2.com/"})
```

A single prefix or a list of multiple prefixes can be deleted with `RDF.Graph.delete_prefixes/2`.

```elixir
graph
|> RDF.Graph.delete_prefixes("ex"])
|> RDF.Graph.delete_prefixes([:ex2, :schema])
```

When a graph is read from such serialization format the deserialized prefixes are automatically stored in the `RDF.Graph` structure.

Writing a RDF data structure gives you more options for which prefixes should be serialized:

1. The `prefixes` option of the `write_*` functions can be used provide prefix mappings in all the different ways mentionend above and always have the highest precedence.
2. If the RDF data to be serialized is given as a `RDF.Graph` with defined `prefixes` these are used, when no prefixes are given with `prefixes` option otherwise.
3. As a fallback when prefixes are not defined in these ways the `RDF.default_prefixes/0` are used. You can configure these with the `default_prefixes` compile-time configuration in your `confix.exs` files:

```elixir
config :rdf,
  default_prefixes: %{
    ex: "http://example.com/"
  }
```

4. The `RDF.default_prefixes/0` always contain the `RDF.standard_prefixes/0` consisting of prefixes the usual `xsd`, `rdf` and `rdfs` prefixes. If you don't want to use these `RDF.standard_prefixes/0` for your `default_prefixes` you'll explicitly have to disable them with the `use_standard_prefixes` compile-time configuration option.

```elixir
config :rdf,
  use_standard_prefixes: false
```

