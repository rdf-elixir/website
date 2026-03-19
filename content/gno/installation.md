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

### QLever

[QLever](https://github.com/ad-freiburg/qlever) requires building an index before starting the server. Install the `qlever` CLI tool, then:

```bash
# Create a Qleverfile (or configure manually)
qlever setup-config default

# Add your data files and build the index
qlever index

# Start the server with update support
qlever start --persist-updates
```

QLever listens on the port configured in the Qleverfile and requires an access token for write operations.

### GraphDB

Install [Ontotext GraphDB](https://graphdb.ontotext.com/) following the [official installation guide](https://graphdb.ontotext.com/documentation/11.0/installation.html). It listens on port 7200 by default.

## Next Steps

With the dependencies installed and a store backend running, you need to configure your service, repository, and store connection through Gno's manifest system. Continue with the [Configuration](configuration) guide.
