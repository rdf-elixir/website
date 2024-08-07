# SPARQL client configuration

SPARQL.Client uses [Tesla](https://github.com/teamon/tesla), an abstraction over different HTTP client libraries. This allows you to use the HTTP client of your choice, as long as a Tesla adapter exists. Currently httpc, [hackney](https://github.com/benoitc/hackney) or [ibrowse](https://github.com/cmullaparthi/ibrowse), [gun](https://github.com/ninenines/gun), [mint](https://github.com/elixir-mint/mint) and [finch](https://github.com/sneako/finch) are supported. See [this list](https://github.com/teamon/tesla#adapters) 

Without further configuration, the built-in Erlang httpc is used. 

::: warning

It is strongly advised to use one of the alternatives, since httpc has a [lot of issues](https://github.com/teamon/tesla/issues?utf8=%E2%9C%93&q=is%3Aissue+label%3Ahttpc+) and will very likely cause troubles sooner or later.

:::

If you want to use another client library, you'll have to add it to your list of dependencies in `mix.exs` and configure Tesla to use it.

So, for hackney you'll have to add `hackney` to `mix.exs`:

```elixir
def deps do
  [
    {:sparql_client, "~> 0.5"},
    {:hackney, "~> 1.6"}
  ]
end
```

and add this line to your `config.exs` file (or environment specific configuration):

```elixir
config :tesla, :adapter, Tesla.Adapter.Hackney
```


If you want to pass custom, per-request middleware or adapter options for Tesla (see `opts` option of the `Tesla.request/2` function) you can do this via the `request_opts` option of `SPARQL.Client.querty/3` function. For example, the timeout option for the Hackney adapter can be set like this:

```elixir
SPARQL.Client.query(query, "http://example.com/sparql",
    request_opts: [adapter: [recv_timeout: 30_000]])
```

::: warning

Unfortunately, there's currently no general way to set the timeout, because of this open Tesla issue <https://github.com/teamon/tesla/issues/255>. So for now, timeouts must be set in an adapter-specific way like shown in the previous example.

:::

The SPARQL.Client package also supports configuring the defaults for many of the various options of the query and update functions through the application environment. See the [API documentation](http://hexdocs.pm/sparql_client/SPARQL.Client.html) for information on this.
