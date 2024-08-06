# Resource generators

When you need a configurable and customizable way to generate resource identifiers in your application, you can provide that with the help of `RDF.Resource.Generator`s, a behaviour for configurable identifier generation strategies.
They support the generation of two kinds of identifiers:

1. parameter-less identifiers which will be random by nature
2. identifiers which are based on some value, where every attempt to create an identifier for the same value, should be produce the same identifier

These `RDF.Resource.Generator` implementations, however, are not meant to be used directly, but through a wrapper function instead. Let's discuss how they can be used in the context of an example. Let's say we want to implement an algorithm `foo` that needs to create some resources with random identifiers along the way, for which we don't want to require the user to provide the ids, but give him some customizability options for the automatic generation of the identifiers of these resources instead. 
So, we decide to implement this with `RDF.Resource.Generator`s.
We just have to define a function like this:

```elixir
defmodule Foo do
  def id do 
    RDF.Resource.Generator.generate(id_config())
  end

  defp id_config do
    Application.get_env(:foo, :id, generator: RDF.BlankNode)
  end
end
```

This function simple delegates to `RDF.Resource.Generator.generate/1`, passing it a configuration specifically introduced for this purpose. We've also provided a default configuration using `RDF.BlankNode` (which implements the `RDF.Resource.Generator` behaviour) as the default generator. 

We can now use our `id/0` function in our algorithm to generate ids.

```elixir
iex> Foo.id()
~B<b323>

iex> Foo.id()
~B<b355>
```

When a user wants to have UUIDs generated instead, he can simply configure it like this (more configurations options are discussed below):

```elixir
config :foo, :id, generator: RDF.IRI.UUID.Generator
```

The `id/0` function will now produce the respective UUID identifiers as specified.

```elixir
iex> Foo.id()
~I<urn:uuid:4f643db7-50f1-4838-8e7a-3c6fde092d2a>

iex> Foo.id()
~I<urn:uuid:48d07745-097c-4fe2-8200-9a3c9db06875>
```

If you want to use a value-based generator instead or additionally, you can define a function which takes the value and passes it to `RDF.Resource.Generator.generate/2`.

```elixir
defmodule Foo do
  def id do 
    RDF.Resource.Generator.generate(id_config())
  end

  def id(value) do 
    RDF.Resource.Generator.generate(id_config(), value)
  end

  defp id_config do
    Application.get_env(:foo, :id, generator: RDF.BlankNode)
  end
end
```

Besides the predefined the generators, users also have a chance to define their own custom generators and let your algorithm use them.



## Predefined generators

RDF.ex comes with a few implementations of the `RDF.Resource.Generator` behaviour out-of-the-box.


### Blank nodes generators

We've already seen above that the `RDF.BlankNode` module implements the `RDF.Resource.Generator` behaviour. It doesn't have any further configuration options and is fine in most scenarios as a default generator. However, it does not support value-based identifier generation. 

The `RDF.BlankNode.Generator` is an implementation which supports generation of both kinds of identifiers. It generates auto-incremented blank nodes and remembers the numbers it generated for given values. So, as a stateful generator it requires you to start the `RDF.BlankNode.Generator` as a GenServer under a name which you can provide in the configuration.

```elixir
defmodule Your.Application do
  use Application

  @impl true
  def start(_type, _args) do
    children = [
        {RDF.BlankNode.Generator, {RDF.BlankNode.Increment, [name: FooCounter]}}
        # ...
    ]

    opts = [strategy: :one_for_one, name: Your.Supervisor]
    Supervisor.start_link(children, opts)
  end
end

```

```elixir
config :foo, :id, 
  generator: RDF.BlankNode.Generator,
  pid: FooCounter
```

Let's see our generator function in action with this configuration:

```elixir
iex> Foo.id()
~B<b0>

iex> Foo.id("test")
~B<b1>

iex> Foo.id()
~B<b2>

iex> Foo.id("test")
~B<b1>
```

::: warning
The state of the `RDF.BlankNode.Generator` is not persisted!
:::

::: tip
You might be wondering what the `RDF.BlankNode.Increment` in the child specification means. The `RDF.BlankNode.Generator` is the basis of the implementation of the `BNODE` SPARQL function in SPARQL.ex and can be customized with different implementations of the `RDF.BlankNode.Generator.Algorithm`. `RDF.BlankNode.Increment` however is the only implementation of this behaviour for now.
:::


### UUID generator

The `RDF.IRI.UUID.Generator` allows to generate various kinds of UUID-based URI identifiers. 

It supports various configuration options:

- `:prefix`: The URI prefix to be prepended to the generated UUID.
   It can be given also as `RDF.Vocabulary.Namespace` module.
   If the `:uuid_format` is set explicitly to something other than `:urn`
   (which is the default), this is a required parameter.
- `:uuid_version`: The UUID version to be used. Can be any of the integers 1 and 4 for random-based identifiers (4 being the default) and 3 and 5 for value-based identifiers (5 being the default). 
- `:uuid_format`: The format of the UUID to be generated. Can be any of the following atoms:
    - `:urn`: a standard UUID representation, prefixed with the UUID URN (in this case the `:prefix` is not used) (the default when no `:prefix` given)
    - `:default`: a standard UUID representation, appended to the `:prefix` value (the default when a `:prefix` is given)
    - `:hex`: a standard UUID without the `-` (dash) characters, appended to the `:prefix` value
- `:uuid_namespace` (only with `:uuid_version` 3 and 5, where it is a required parameter)

When your generator configuration is just for a function producing one of the two kinds of identifiers, you can use these options directly. Otherwise you must provide the identifier-specific configuration under one of the keys `:random_based` and `:value_based`.

Here's a possible configuration for our example from above:

```elixir
config :foo, :id, 
  generator: RDF.IRI.UUID.Generator,
  prefix: "http://example.com/",
  uuid_format: :hex,
  random_based: [
    uuid_version: 1
  ],
  value_based: [
    uuid_version: 3,
    uuid_namespace: UUID.uuid5(:url, "http://your.application.com/foo")
  ]
```



