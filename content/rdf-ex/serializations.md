# Serializations

The RDF.ex package comes with implementations of the [N-Triples](https://www.w3.org/TR/n-triples/), [N-Quads](https://www.w3.org/TR/n-quads/), [Turtle](https://www.w3.org/TR/turtle/) and [TriG](https://www.w3.org/TR/trig/) serialization formats (incl. the respective RDF-star extensions). 
Formats which require additional dependencies are implemented in separate Hex packages.
The [JSON-LD](http://www.w3.org/TR/json-ld/) format for example is available with the [JSON-LD.ex](https://hex.pm/packages/json_ld) package and the [RDF-XML](http://www.w3.org/TR/rdf-syntax-grammar/) format is available with the [RDF-XML.ex](https://hex.pm/packages/rdf_xml) package.

RDF graphs and datasets can be read and written to files, strings or streams in a RDF serialization format using the  `read_file/2`, `read_string/2`, `read_stream/2` and the `write_file/3`, `write_string/2` and `write_stream/2` functions of the resp. `RDF.Serialization.Format` module.

```elixir
{:ok, graph} = RDF.NTriples.read_file("/path/to/some_file.nt")
{:ok, nquad_string} = RDF.NQuads.write_string(graph)
```

::: tip

`use RDF` defines an `alias` for all of the serializations format implemented in RDF.ex, so that you can use them via `NTriples`, `NQuads` and `Turtle.`

:::


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


## Streaming

Some of the available serialization formats also provide support for reading serializations from files and writing serializations to streams. At the moment these are the builtin N-Triples and N-Quads formats and the RDF-XML format. For those you have the `read_stream/2`, `read_stream!/2`  and `write_stream/2` functions available.

```elixir
graph = RDF.XML.read_stream!(xml_stream)
xml_stream = RDF.XML.write_stream(graph)
```

Note, that there's no `write_stream!/2` function. Since it's not possible to determine upfront, if anything will be ok with the stream, `write_stream/2` behaves like the other bang variants: It returns the stream directly and errors during consumption of the stream will raise an error.

Many times you'll want read streams from the contents of a file or write streams whose content is written to a file. In these cases you don't have to reach for the stream functions, but can use the file read and write functions instead. For formats with streaming support they use streaming by default, except for `write_file/3`. For the same reason as above, only `write_file!/3` uses streams by default. But you can use the `:stream` option to opt-in on `write_file/3` or opt-out on the other functions.


## File compression

Both file reader and writer functions support a `gzip` option which allows to read and write from and to gzip'ed files directly.

```elixir
RDF.NTriples.read_file!("/path/to/some_file.nt.gz")
|> RDF.XML.write_file!("/path/to/some_file.rdf.gz")
```

This feature can also be combined with file access via streams.


## Base IRI

For serialization formats which support it, you can provide a base IRI on the read functions with the `base_iri` option. If you don't pass it, the base IRI associated with the serialized graph is used. This is automatically set on deserialization to the one used in serialization or you set it on the graph with the `RDF.Graph.set_base_iri/2` function, which also also accepts [`RDF.Vocabulary.Namespace` modules](/rdf-ex/namespaces).


```elixir
graph
|> RDF.Graph.set_base_iri(EX)
```

You can also provide a default base IRI in your application configuration, which will be used when no base IRI is given as an option or is set on the graph.

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

