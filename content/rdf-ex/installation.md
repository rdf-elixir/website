# Installation

The [RDF.ex Hex package](https://hex.pm/packages/rdf) can be installed as usual, by adding `rdf` to your list of dependencies in `mix.exs`:

```elixir
def deps do
  [
    {:rdf, "~> 2.1"}
  ]
end
```

If you want to read or write [JSON-LD](http://www.w3.org/TR/json-ld/), you also have to add `json_ld` to your dependencies for the separate [JSON-LD.ex](https://hex.pm/packages/json_ld) package. 
If you want to read or write [RDF-XML](http://www.w3.org/TR/rdf-syntax-grammar/), you have to add `rdf_xml` to your dependencies for the separate [RDF-XML.ex](https://hex.pm/packages/rdf_xml) package.

```elixir
def deps do
  [
    {:rdf, "~> 2.1"},
    {:rdf_xml, "~> 1.2"},
    {:json_ld, "~> 1.0"},
  ]
end
```


## HTTP client configuration

JSON-LD.ex uses [Tesla](https://github.com/teamon/tesla), an abstraction over different HTTP client libraries. This allows you to use the HTTP client of your choice, as long as a Tesla adapter exists. Currently httpc, [hackney](https://github.com/benoitc/hackney) or [ibrowse](https://github.com/cmullaparthi/ibrowse), [gun](https://github.com/ninenines/gun), [mint](https://github.com/elixir-mint/mint) and [finch](https://github.com/sneako/finch) are supported. See [this list](https://github.com/teamon/tesla#adapters) 

Without further configuration, the built-in Erlang httpc is used. 

::: warning

It is strongly advised to use one of the alternatives, since httpc has a [lot of issues](https://github.com/teamon/tesla/issues?utf8=%E2%9C%93&q=is%3Aissue+label%3Ahttpc+) and will very likely cause troubles sooner or later.

:::

If you want to use another client library, you'll have to add it to your list of dependencies in `mix.exs` and configure Tesla to use it.

So, for hackney you'll have to add `hackney` to `mix.exs`:

```elixir
def deps do
  [
    {:json_ld, "~> 1.0"},
    {:hackney, "~> 1.6"}
  ]
end
```

and add this line to your `config.exs` file (or environment specific configuration):

```elixir
config :tesla, :adapter, Tesla.Adapter.Hackney
```
