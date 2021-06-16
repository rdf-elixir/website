# Installation

The [Grax Hex package](https://hex.pm/packages/grax) can be installed as usual, by adding `grax` to your list of dependencies in `mix.exs`:

```elixir
def deps do
  [
    {:grax, "~> 0.3"}
  ]
end
```

Since Grax uses RDF.ex which in turn uses the [ProtocolEx](https://github.com/OvermindDL1/protocol_ex) library under the hood, you'll have to add its compiler in `mix.exs` (after the built-in elixir compiler) :

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

If you're a library developer building something on top of Grax, you should add the same note in your installation instructions, since the compiler configuration is not inherited from dependencies.

:::
