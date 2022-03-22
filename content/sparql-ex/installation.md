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
    {:sparql_client, "~> 0.4"}
  ]
end
```

See also the [SPARQL.Client configuration page](/sparql-ex/sparql-client-configuration) on how to setup the HTTP client to be used by `SPARQL.Client`.
