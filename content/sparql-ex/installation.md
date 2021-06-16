# Installation

The [SPARQL.ex Hex package](https://hex.pm/packages/sparql) can be installed as usual, by adding `sparql` to your list of dependencies in `mix.exs`:

```elixir
def deps do
  [
    {:sparql, "~> 0.3"}
  ]
end
```

The [SPARQL.Client Hex package](https://hex.pm/packages/sparql_client) can be installed by adding `sparql_client` to `mix.exs`:

```elixir
def deps do
  [
    {:sparql_client, "~> 0.3"}
  ]
end
```

See also the [SPARQL.Client configuration page](/sparql-ex/sparql-client-configuration) on how to setup the HTTP client to be used by `SPARQL.Client`.

Since SPARQL.ex uses the [ProtocolEx](https://github.com/OvermindDL1/protocol_ex) library under the hood, you'll have to add its compiler in `mix.exs` (after the built-in elixir compiler):

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

If you're a library developer building something on top of SPARQL.ex or the SPARQL.Client, you should add the same note in your installation instructions, since the compiler configuration is not inherited from dependencies.

You can read about the details why SPARQL.ex needs this library [here](https://marcelotto.medium.com/the-walled-gardens-within-elixir-d0507a568015).

:::
