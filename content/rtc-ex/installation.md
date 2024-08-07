# Installation

The [RTC.ex Hex package](https://hex.pm/packages/rtc) can be installed as usual, by adding `rtc` to your list of dependencies in `mix.exs`:

```elixir
def deps do
  [
    {:rtc, "~> 0.2"}
  ]
end
```

If you want to query compounds from a SPARQL endpoint, you also have to add `sparql_client` to your dependencies. 

```elixir
def deps do
  [
    {:rtc, "~> 0.2"},
    {:sparql_client, "~> 0.5"}
  ]
end
```

See also the [SPARQL.Client configuration page](/sparql-ex/sparql-client-configuration) on how to setup the HTTP client to be used by `SPARQL.Client`.
