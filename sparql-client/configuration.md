# Configuration

SPARQL.Client uses [Tesla](https://github.com/teamon/tesla), an abstraction over different HTTP client libraries. This allows you to use the HTTP client of your choice, as long as a Tesla adapter exists. Currently httpc, [hackney](https://github.com/benoitc/hackney) or [ibrowse](https://github.com/cmullaparthi/ibrowse). 

Without further configuration, the built-in Erlang httpc is used. You can use it for simple tests or to keep your dependencies clean, but I recommend using one of the alternatives. I've experienced encoding related issues with httpc, which none of the other HTTP clients had.

If you want to use another client library, you'll have to add it to your list of dependencies in `mix.exs` and configure Tesla to use it.

So, for hackney you'll have to add `hackney` to `mix.exs`:

```elixir
def deps do
  [
    {:sparql_client, "~> 0.2"},
    {:hackney, "~> 1.6"}
  ]
end
```

and add this line to your `config.exs` file (or environment specific configuration):

```elixir
config :tesla, :adapter, Tesla.Adapter.Hackney
```

The ibrowse configuration looks similarly.

`mix.exs`:

```elixir
def deps do
  [
    {:sparql_client, "~> 0.2"},
    {:ibrowse, "~> 4.2"}
  ]
end
```

`config.exs`:

```elixir
config :tesla, :adapter, Tesla.Adapter.Ibrowse
```

