# Description and Graph DSL

RDF.ex comes with a declarative DSL to encode full RDF graphs in Elixir, which allows to serialize RDF graphs with the full power of Elixir and compile-time checks.

It consists of two building-blocks (which can also be used independently of each other):

- builder functions for compact `RDF.Description`s
- a general builder function for the encoding of `RDF.Graph`s


## Description builder

The functions for the properties on a `RDF.Vocabulary.Namespace` module, which return the `RDF.IRI` of the property (see [here](/rdf-ex/namespaces) for an introduction to `RDF.Vocabulary.Namespace`s), are also available in a description builder variant, that accepts a subject and objects as arguments.

```elixir
RDF.type(EX.Foo, EX.Bar)
```

If you want to state multiple statements with the same subject and predicate, you can pass the objects as a list:

```elixir
RDF.type(EX.Foo, [EX.Bar, EX.Baz])
EX.foo(EX.Bar, [42, EX.Baz])
```

The produced statements are returned by this function as a `RDF.Description` structure. Since the first argument of these property functions also accept an `RDF.Description` for the subject (just using its subject as the subject for newly generated triple), the calls of these functions can be nested easily.
In combination with Elixirs pipe operators this leads to a way to describe RDF resources which resembles [Turtle](https://www.w3.org/TR/turtle/):

```elixir
EX.Foo
|> RDF.type(EX.Bar)
|> EX.baz([1, 2, 3])
```

This will produce this `RDF.Description`:

```
#RDF.Description<subject: ~I<http://example.com/Foo>
  <http://example.com/Foo>
      a <http://example.com/Bar> ;
      <http://example.com/baz> 1, 2, 3 .
>
```


## Graph builder

Full RDF graphs can be build with the `RDF.Graph.build/2` macro. It uses a `do` block in which you can write down RDF triples in any form supported by RDF.ex (including `RDF.Description`s with the description DSL) or Elixir expressions which return any of these forms.
These triples will be added to the created `RDF.Graph` the macro returns.

As usual, you'll have to `require RDF.Graph` to be able to use the macro or just `use RDF`.

```elixir
use RDF
alias NS.EX

RDF.Graph.build do
  {EX.S, EX.P, EX.O}

  EX.S2
  |> EX.p1(EX.O2)
  |> EX.p2([1, 2, 3])
  
  %{
    EX.S3 => %{
      EX.p1() => EX.O1,
      EX.p2() => [EX.O2, EX.O3]
    }
  }
end
```

This will return the following `RDF.Graph`:

```
#RDF.Graph<name: nil
  @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
  @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
  @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

  <http://example.org/S>
      <http://example.org/P> <http://example.org/O> .

  <http://example.org/S2>
      <http://example.org/p1> <http://example.org/O2> ;
      <http://example.org/p2> 1, 2, 3 .

  <http://example.org/S3>
      <http://example.org/p1> <http://example.org/O1> ;
      <http://example.org/p2> <http://example.org/O2>, <http://example.org/O3> .
>
```

Apart from the vocabulary namespaces aliased in the scope of the block, you can use the `RDF`, `RDFS` and `OWL` vocabulary namespaces inside of the build block without an explicit alias.
Also, RDF sigils are available without an explicit `import RDF.Sigils`. 
Similar to the `a` keyword in Turtle, an `a` alias for the `RDF.type` function can be used.

```elixir
require RDF.Graph
alias NS.EX

RDF.Graph.build do
  {~I<http://example.com/Demo>, EX.P, ~L<literal>en}

  EX.Foo
  |> a(OWL.Class)
  |> RDFS.description("example")
end
```

In order to not pollute the context of the `build` caller with these auto-`alias`es and -`import`s, the build block is isolated under the hood from the caller context. But this also means variables from the caller context are not available in the build block. If you want to use them in build block, you'll have to rebind the variables in a keyword list as the first argument of the `build` call.

```elixir
use RDF

foo = 42

RDF.Graph.build foo: foo do
  {EX.S, EX.p(), foo}
end
```

The same applies to `import`s and `require`s from the caller context. You'll have to re-`import` or re-`require` them. Aliases from the caller context, however, are all available because they are re-`alias`ed automatically in the build block.

```elixir
use RDF
alias EX
import Something

RDF.Graph.build do
  # Something is not imported here and needs to be 
  # re-imported again to be available
  import Something

  # EX is available  
  {EX.S, something(), EX.O}
end
```

In fact, with Elixir versions >= 1.17, aliases inside of the build block are no longer supported, i.e. don't have the desired effect. However, instead of aliasing vocabulary namespaces in the surrounding module, there is a better solution anyway: you can also declare them inside of the build block with a `@prefix` definition. This will not only create an alias for the vocabulary namespace in the build block, but adds it as a prefix to the created `RDF.Graph`. By default, it will use the downcased and underscored name of the vocabulary namespace module (resp. the last segment of its fully qualified name), but you can also define a custom prefix by providing it as the key in a keyword tuple after the `@prefix`, instead of just defining the vocabulary namespace module.

```elixir
require RDF.Graph

RDF.Graph.build do
  @prefix NS.FOAF
  @prefix rel: NS.Rel

  ~I<http://example.org/#green-goblin>
    |> a(FOAF.Person)    
    |> Rel.enemyOf(~I<http://example.org/#spiderman>)
    |> FOAF.name("Green Goblin")

  ~I<http://example.org/#spiderman>
    |> a(FOAF.Person)
    |> Rel.enemyOf(~I<http://example.org/#green-goblin>)
    |> FOAF.name(["Spiderman", ~L"Человек-паук"ru])
end
```

This will build the following `RDF.Graph`:

```
#RDF.Graph<name: nil
  @prefix foaf: <http://xmlns.com/foaf/0.1/> .
  @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
  @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
  @prefix rel: <http://www.perceive.net/schemas/relationship/> .
  @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

  <http://example.org/#green-goblin>
      a foaf:Person ;
      rel:enemyOf <http://example.org/#spiderman> ;
      foaf:name "Green Goblin" .

  <http://example.org/#spiderman>
      a foaf:Person ;
      rel:enemyOf <http://example.org/#green-goblin> ;
      foaf:name "Человек-паук"@ru, "Spiderman" .
>
```

When you want to use terms from a URI namespace for which you don't have `RDF.Vocabulary.Namespace` defined in your application, you can define an ad-hoc namespace in your `build` block with a `@prefix` definition and a string with the URI namespace. In that case you must also provide the prefix to be used. The name for the generated ad-hoc vocabulary namespace will be the upper-cased version of the prefix.

```elixir
RDF.Graph.build do
  @prefix ex: "http://example.com/ad-hoc/"

  Ex.S |> Ex.p(Ex.O)
end
```
This will result in the following `RDF.Graph`:

```elixir
#RDF.Graph<name: nil
  @prefix ex: <http://example.com/ad-hoc/> .
  @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
  @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
  @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

  ex:S
      ex:p ex:O .
>
```

::: warning

Unfortunately, for Elixir versions < 1.13 you might encounter undefined-function warnings for uses of lower-cased terms from ad-hoc namespaces defined with such `@prefix` definitions.

:::


The base URI of the `RDF.Graph` can be specified with a `@base` declaration and the URI as a string, IRI sigil or a vocabulary namespace. With a `@base` declaration in place, all IRI sigils in the build block with relative URIs, will be automatically resolved to absolute URIs against the specified base URI.

```elixir
require RDF.Graph

RDF.Graph.build do
  @base EX
  @prefix FOAF
  @prefix Rel
  
  ~I<#green-goblin>
    |> a(FOAF.Person)    
    |> Rel.enemyOf(~I<#spiderman>)
    |> FOAF.name("Green Goblin")

  ~I<#spiderman>
    |> a(FOAF.Person)
    |> Rel.enemyOf(~I<#green-goblin>)
    |> FOAF.name(["Spiderman", ~L"Человек-паук"ru])
end
```

Now, we're building this `RDF.Graph`:

```
#RDF.Graph<name: nil
  @base <http://example.org/> .

  @prefix foaf: <http://xmlns.com/foaf/0.1/> .
  @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
  @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
  @prefix rel: <http://www.perceive.net/schemas/relationship/> .
  @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

  <#green-goblin>
      a foaf:Person ;
      rel:enemyOf <#spiderman> ;
      foaf:name "Green Goblin" .

  <#spiderman>
      a foaf:Person ;
      rel:enemyOf <#green-goblin> ;
      foaf:name "Человек-паук"@ru, "Spiderman" .
>
```

So far, all examples have shown fixed triple structures only, but the build blocks can include any Elixir expression, as long it returns RDF data in any of the forms supported by RDF.ex.

```elixir
RDF.Graph.build file: file, args: args, rank: rank do
  @base "http://chess.example.com/"
  ExampleModule.function_returning_rdf(args)

  Enum.map(1..100, &{EX.S, EX.p(), &1})

  for file <- ?a..?h, rank <- 1..8 do
    ~i<##{file}#{rank}>
    |> a(Chess.Square)
  end
end
```

If an expression evaluates to `nil` or `:ok`, it will be excluded automatically. This enables the use of conditionals and the use of the logger in your build blocks:

```elixir
RDF.Graph.build args: args do
  # the nil result in the negative case is ignored
  if someCondition?(args) do
    ExampleModule.function_returning_rdf(args)
  end 

  if good_data?(args) do
    ExampleModule.function_returning_more_rdf(args)
  else
    # the :ok value returned by Logger.warn/1 is ignored
    Logger.warn("Bad data was ignored")
  end 
end
```

Assignments in build blocks are essentially declarations, as their results are also ignored from the inclusion in the produced graph. 

```elixir
RDF.Graph.build do
  reusable_value = 42
 
  EX.S1 |> EX.p(reusable_value)
  EX.S2 |> EX.p(reusable_value)
end
```

So, if you assign some RDF data to a variable and want to include it in the graph, you have to evaluate the assigned variable explicitly.

```elixir
RDF.Graph.build do
  triple = EX.S |> EX.p(EX.O)
  triple
end
```

The fact that assignments are not added to the graph, allows you to use them to ignore an expression in a build block, which does return something you don't want to include in the built RDF graph.

```elixir
RDF.Graph.build args: args do
  _ = function_with_side_effects()

  ExampleModule.function_returning_rdf(args)
end
```

Note that the assignments are still pattern matches, so they can be used as validation guards.

```elixir
RDF.Graph.build args: args do
  {:ok, _} = function_with_side_effects()

  ExampleModule.function_returning_rdf(args)
end
```

Finally, you can also exclude the result of an expression from inclusion in the built RDF graph more explicitly, by prepending it with the `exclude` function.

```elixir
RDF.Graph.build args: args do
  exclude function_with_side_effects()

  ExampleModule.function_returning_rdf(args)
end
```

The `RDF.Graph.build/2` function also accepts all options available on `RDF.Graph.new/2` as the second argument, which it will use to create the initial `RDF.Graph` to which the triples in the build block are added. The `@prefix`es and `@base` URI declared within the build block will overwrite the ones from `:prefixes` and `:base` keyword options.

```elixir
use RDF
alias NS.EX

opts = [
  name: EX.GraphName, 
  base_iri: "http://base_iri/A",
  prefixes: [
    ex: EX.old(), 
    other: EX.used()
  ],
  init: {EX.Foo, EX.Bar, EX.Baz}
]

RDF.Graph.build [], opts do
  @base "http://base_iri/B"
  @prefix ex: EX

  EX.S |> EX.p(EX.O)
end
```

This will build this graph: 

```
#RDF.Graph<name: ~I<http://example.org/GraphName>
  @base <http://base_iri/B> .

  @prefix ex: <http://example.org/> .
  @prefix other: <http://example.org/used> .

  ex:Foo
      ex:Bar ex:Baz .

  ex:S
      ex:p ex:O .
>
```

::: tip

Providing an existing graph on the `:init` opt is the shortest way to use `build` for adding statements to an existing graph.

:::
