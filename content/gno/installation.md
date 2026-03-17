# Installation

The [Gno Hex package](https://hex.pm/packages/gno) can be installed as usual, by adding `gno` to your list of dependencies in `mix.exs`:

```elixir
def deps do
  [
    {:gno, "~> 0.1"}
  ]
end
```

Gno uses `SPARQL.Client` under the hood for communication with SPARQL stores, so you should also configure an HTTP adapter. See the [SPARQL.Client configuration page](/sparql-ex/sparql-client-configuration) for details. For example, to use Hackney:

```elixir
# mix.exs
def deps do
  [
    {:gno, "~> 0.1"},
    {:hackney, "~> 1.6"}
  ]
end
```

```elixir
# config/config.exs
config :tesla, adapter: Tesla.Adapter.Hackney
```

## Backend Setup

You need a running SPARQL triple store to use Gno. Here is how to set up the most common backends for development:

### Fuseki

[Apache Jena Fuseki](https://jena.apache.org/documentation/fuseki2/) can be started with `fuseki-server`. After starting, create a dataset:

```bash
curl -X POST http://localhost:3030/$/datasets \
  -d "dbType=mem&dbName=gno-dev-dataset" \
  -H "Content-Type: application/x-www-form-urlencoded"
```

### Oxigraph

[Oxigraph](https://github.com/oxigraph/oxigraph) can be started with:

```bash
oxigraph serve --location /tmp/oxigraph-data
```

It listens on port 7878 by default and requires no additional setup.

## Next Steps

With the dependencies installed and a store backend running, you need to configure your service, repository, and store connection through Gno's manifest system. Continue with the [Configuration](configuration) guide.
