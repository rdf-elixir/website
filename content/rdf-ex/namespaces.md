# Namespaces and vocabularies

RDF.ex supports modules which represent RDF vocabularies as `RDF.Vocabulary.Namespace`s, which allow for something similar to QNames in XML: an atom or function qualified with a `RDF.Vocabulary.Namespace` can be resolved to an IRI. RDF.ex comes with predefined modules for some fundamental vocabularies defined in the `RDF.NS` module.

There are two types of terms in a `RDF.Vocabulary.Namespace` which are
resolved differently:

1. Capitalized terms are by standard Elixir semantics module names, i.e.
   atoms. At all places in RDF.ex where an IRI is expected, you can use atoms
   qualified with a `RDF.Vocabulary.Namespace` instead. If you want to resolve them manually, you can pass a `RDF.Vocabulary.Namespace` qualified atom to `RDF.iri`.
2. Lowercased terms for RDF properties are represented as functions on a
   `RDF.Vocabulary.Namespace` module and return the IRI directly, but since `RDF.iri` can also handle IRIs directly, you can safely and consistently use it with lowercased terms too.

```elixir
iex> import RDF, only: [iri: 1]
iex> alias RDF.NS.{RDFS}

iex> RDFS.Class
RDF.NS.RDFS.Class

iex> iri(RDFS.Class)
~I<http://www.w3.org/2000/01/rdf-schema#Class>

iex> RDFS.subClassOf
~I<http://www.w3.org/2000/01/rdf-schema#subClassOf>

iex> iri(RDFS.subClassOf)
~I<http://www.w3.org/2000/01/rdf-schema#subClassOf>
```

As this example shows, the namespace modules can be easily `alias`ed. When required, they can be also aliased to a completely different name. Since the `RDF` vocabulary namespace in `RDF.NS.RDF` can't be aliased (it would clash with the top-level `RDF` module), all of its elements can be accessed directly from the `RDF` module without an alias.

```elixir
iex> import RDF, only: [iri: 1]
iex> RDF.type
~I<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>

iex> iri(RDF.Property)
~I<http://www.w3.org/1999/02/22-rdf-syntax-ns#Property>
```

This way of expressing IRIs has the additional benefit, that the existence of the referenced IRI is checked at compile time, i.e. whenever a term is used that is not part of the resp. vocabulary an error is raised by the Elixir compiler (unless the vocabulary namespace is non-strict; see below).

For terms not adhering to the capitalization rules (lowercase properties, capitalized non-properties) or containing characters not allowed within atoms, the predefined namespaces in `RDF.NS` define aliases accordingly. If unsure, have a look at the documentation or their definitions. 


## Pattern matching

You can't use terms from vocabulary namespaces in pattern matching expressions, since function calls are generally not allowed during pattern matches in Elixir. With the `term_to_iri/1` macro from the `RDF.Namespace.IRI` module, however, you can do just that. This macro is also automatically imported when you `use RDF`.

```elixir
use RDF
# or an explicit: import RDF.Namespace.IRI

case expr do
  term_to_iri(EX.Foo) -> ...
  term_to_iri(EX.bar()) -> ...
  ...
end
```

The predefined guards described in the [API docs](https://hexdocs.pm/rdf/RDF.Guards.html) are also useful in this context.


## Defining vocabulary namespaces

There are two basic ways to define a namespace for a vocabulary:

1. You can define all terms manually.
2. You can extract the terms from existing RDF data for IRIs of resources under the specified base IRI.

It's recommended to introduce a dedicated module for the defined namespaces. In this module you'll `use RDF.Vocabulary.Namespace` and define your vocabulary namespaces with the `defvocab` macro.

A vocabulary namespace with manually defined terms can be defined as a list of atoms or strings with the `terms` option like that:

```elixir
defmodule YourApp.NS do
  use RDF.Vocabulary.Namespace

  defvocab EX,
    base_iri: "http://www.example.com/ns/",
    terms: [:Foo, :bar]
    
end
```

The `base_iri` argument with the IRI prefix of all the terms in the defined
vocabulary is required. Terms will be checked for invalid characters at compile-time and will raise a compiler error. This handling of invalid characters can be modified with the `invalid_characters` options, which is set to `:fail` by default. By setting it to `:warn` only warnings will be raised or it can be turned off completely with `:ignore`.

A vocabulary namespace with extracted terms can be defined either by providing RDF data directly with the `data` option or files with serialized RDF data in the `priv/vocabs` directory using the `file` option:

```elixir{6}
defmodule YourApp.NS do
  use RDF.Vocabulary.Namespace

  defvocab EX,
    base_iri: "http://www.example.com/ns/",
    file: "your_vocabulary.nt"
    
end
```

During compilation the terms will be validated and checked for proper capitalisation by analyzing the schema description of the resp. resource  in the given data.
This validation behaviour can be modified with the `case_violations` options, which supports the following values:

- `:warn`: raises a warning on case violations (default)
- `:fail`: raises an error on case violations
- `:ignore`: ignores case violations
- `:auto_fix`: fixes a case violation by automatically defining an alias with the proper casing of the first letter
- an anonymous function or `{module, fun_name}` tuple to an external function, which receives a `:resource` or `:property` atom and a case violated term and returns a properly cased alias in an ok tuple

If your dealing with a lot of instance data with a lot of resources with lowercased term which you don't want to capitalize, you can set the `allow_lowercase_resource_terms` option to `true`.

Invalid characters or violations of capitalization rules can be fixed by defining aliases for these terms with the `alias` option and a keyword list where the keys are alias and the value the aliased terms as an atom or string:

```elixir{7}
defmodule YourApp.NS do
  use RDF.Vocabulary.Namespace

  defvocab EX,
    base_iri: "http://www.example.com/ns/",
    file: "your_vocabulary.nt"
    alias: [example_term: "example-term"]

end
```

When defining a vocabulary namespace manually over the `terms` option, you can also define the aliases within the list of terms. So instead of having to repeat the aliased term in a definition like this:

```elixir{6-7}
defmodule YourApp.NS do
  use RDF.Vocabulary.Namespace

  defvocab EX,
    base_iri: "http://www.example.com/ns/",
    terms: ["Foo-bar", "Baz"],
    alias: [FooBar: "Foo-bar"]
end
```

You can define the same vocabulary namespace like this:

```elixir{6-9}
defmodule YourApp.NS do
  use RDF.Vocabulary.Namespace

  defvocab EX,
    base_iri: "http://www.example.com/ns/",
    terms: [
      :Baz,
      FooBar: "Foo-bar"
    ]
end
```

The `terms` option can be used also in conjunction with the `file` and `data` option, but is having a different semantics in this case: it restricts the terms loaded from the vocabulary data to the specified ones.

```elixir{6-10}
defmodule YourApp.NS do
  use RDF.Vocabulary.Namespace

  defvocab EX,
    base_iri: "http://www.example.com/ns/",
    file: "your_vocabulary.ttl",
    terms: [
      :Baz,
      FooBar: "Foo-bar"
    ]
end
```

You can also provide an anonymous function or a `{module, fun_name}` tuple to an external function to process the terms from the `:file` or `:data` vocabulary definitions. The function receives two arguments: either the `:property` or `:resource` classifying the reference of the term and a term as a string. It must return one of the following results:

- an `{:ok, term}` tuple, where `term` is either the given term unchanged or another term which should be used as an alias for the given term
- `:ignore`, if the given term should be ignored
- an `{:error, error}` tuple, which will result in an error for the given term in the error report
- an `{:abort, error}` tuple, which will result in an abortion of the vocabulary namespace creation with the given `error` raised

```elixir
defmodule YourApp.NS do
  use RDF.Vocabulary.Namespace

  # We're using the ReCase library in this example

  defvocab EX,
    base_iri: "http://www.example.com/ns/",
    file: "your_vocabulary.ttl",
    terms: fn 
      _, "_" <> _     -> :ignore
      _, "erroneous"  -> {:error, "erroneous term"}
      :resource, term -> {:ok, Recase.to_pascal(term)}
      :property, term -> {:ok, Recase.to_snake(term)}
    end
end
```

When your term handler function is defined externally, you can refer to this function with an `{module, fun_name}` tuple. But you can also add an additional argument in a `{module, fun_name, arguments}` tuple, which can be handy when you want have a common term mapping module. In that case the function is expected to have as many additional arguments as the `arguments` list contains.

```elixir
defmodule YourApp.NS do
  use RDF.Vocabulary.Namespace

  defvocab EX,
    base_iri: "http://www.example.com/ns/",
    file: "your_vocabulary.ttl",
    terms: {YourApp.TermHandler, :handle_term, [:variant1]}
end

defmodule YourApp.TermHandler do
  def handle_term(type, term, variant \\ :variant1)
  def handle_term(_, "_" <> _, _), do: :ignore
  def handle_term(:resource, term, _), do: {:ok, Recase.to_pascal(term)}
  def handle_term(:property, term, :variant1), do: {:ok, Recase.to_snake(term)}
  def handle_term(:property, term, :variant2), do: {:ok, Recase.to_camel(term)}
end
```

If you just want to ignore a couple terms, you can also do that with the `:ignore` option:

```elixir{7}
defmodule YourApp.NS do
  use RDF.Vocabulary.Namespace

  defvocab EX,
    base_iri: "http://www.example.com/ns/",
    file: "your_vocabulary.nt",
    ignore: ~w[Foo bar]
    
end
```

Though strongly discouraged, a vocabulary namespace can be defined as non-strict with the `strict` option set to `false`. A non-strict vocabulary doesn't require any terms to be defined (although they can). A term is resolved dynamically at runtime by concatenation of the term and the base IRI of the resp. namespace module:

```elixir
defmodule YourApp.NS do
  use RDF.Vocabulary.Namespace

  defvocab EX,
    base_iri: "http://www.example.com/ns/",
    terms: [], 
    strict: false
end

iex> import RDF, only: [iri: 1]
iex> alias YourApp.NS.{EX}

iex> iri(EX.Foo)
~I<http://www.example.com/ns/Foo>

iex> EX.bar
~I<http://www.example.com/ns/bar>

iex> EX.Foo |> EX.bar(EX.Baz)
#RDF.Description<
  <http://example.com/Foo>
      <http://example.com/bar> <http://example.com/Baz> .
>
```

::: warning

Non-strict vocabularies can't provide compile-time checks. For this reason, their usage is not recommended in production code. A typical usage scenario are tests for example.

Unfortunately, the compiler Elixir generally raises warnings when using the property functions of a non-strict vocabulary namespace. In order to get rid of this warnings, you have add the following compiler attribute in modules calling such property functions:

```elixir
@compile {:no_warn_undefined, YourApp.NS.NonStrictVocab}
```

Since the underlying Erlang feature for this is a bit controversial in Elixir, it seems [this issue](https://github.com/elixir-lang/elixir/issues/11922) won't be fixed. If someone knows a workaround for this, a PR would be very welcome.

:::


## Vocabulary namespace metadata

Every `RDF.Vocabulary.Namespace` module has a couple of special metadata functions about the vocabulary itself. The most important ones are `__base_iri__/0`, `__iris__/0` and `__file__/0`.

The `__base_iri__/0` function returns the base IRI of the vocabulary namespace and the `__iris__/0` function all IRIs which can be referenced with this namespace.

```elixir
iex> RDF.NS.RDFS.__base_iri__
"http://www.w3.org/2000/01/rdf-schema#"

iex> RDF.NS.RDFS.__iris__
[~I<http://www.w3.org/2000/01/rdf-schema#Class>,
 ~I<http://www.w3.org/2000/01/rdf-schema#Container>,
 ~I<http://www.w3.org/2000/01/rdf-schema#ContainerMembershipProperty>,
 ~I<http://www.w3.org/2000/01/rdf-schema#Datatype>,
 ~I<http://www.w3.org/2000/01/rdf-schema#Literal>,
 ~I<http://www.w3.org/2000/01/rdf-schema#Resource>,
 ~I<http://www.w3.org/2000/01/rdf-schema#comment>,
 ~I<http://www.w3.org/2000/01/rdf-schema#domain>,
 ~I<http://www.w3.org/2000/01/rdf-schema#isDefinedBy>,
 ~I<http://www.w3.org/2000/01/rdf-schema#label>,
 ~I<http://www.w3.org/2000/01/rdf-schema#member>,
 ~I<http://www.w3.org/2000/01/rdf-schema#range>,
 ~I<http://www.w3.org/2000/01/rdf-schema#seeAlso>,
 ~I<http://www.w3.org/2000/01/rdf-schema#subClassOf>,
 ~I<http://www.w3.org/2000/01/rdf-schema#subPropertyOf>]
```

The `__file__/0` function returns the path to the file from which the vocabulary namespace was created from with the `:file` option. This allows you to get easy access to all vocabulary descriptions you're using in your application via vocabulary namespaces, including those from libraries your application is using.

```elixir
iex> RDF.NS.RDFS.__file__
"/local-path/your-app/_build/dev/lib/rdf/priv/vocabs/rdfs.ttl"

iex> RDF.read_file(RDF.NS.RDFS.__file__)
{:ok,
 #RDF.Graph<name: nil
  @prefix dc: <http://purl.org/dc/elements/1.1/> .
  @prefix owl: <http://www.w3.org/2002/07/owl#> .
  @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
  @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

  rdfs:Class
      a rdfs:Class ;
      rdfs:label "Class" ;
      rdfs:comment "The class of classes." ;
      rdfs:isDefinedBy rdfs: ;
      rdfs:subClassOf rdfs:Resource .
...
>}
```


## Namespaces

`RDF.Vocabulary.Namespace`s are in fact just a special case of a more general concept in RDF.ex: `RDF.Namespace`s, which are modules acting as namespaces for terms that can be resolved to IRIs. But a `RDF.Namespace` should not be confused with a IRI namespace. The terms of a `RDF.Namespace` don't have to necessarily refer to IRIs from the same IRI namespace. "Namespace" here is just meant in the sense that an Elixir module is a namespace. Think of them more like the context of JSON-LD, where all terms for the IRIs in the context can be accessed via the same module namespace.

A `RDF.Namespace` can be defined with the `defnamespace` macro, which expects the module name and a keyword list or map of terms and their corresponding IRIs.

```elixir
defmodule YourApp.NS do
  import RDF.Namespace
  
  defnamespace EX, [
                 foo: ~I<http://example1.com/foo>,
                 Bar: "http://example2.com/Bar",
               ]
end
```

A `RDF.Namespace` can be used similarly to `RDF.Namespace.Vocabulary`.

```elixir
iex> import RDF, only: [iri: 1]
iex> alias YourApp.EX

iex> EX.foo()
~I<http://example1.com/foo>

iex> iri(EX.foo())
~I<http://example1.com/foo>

iex> iri(EX.Bar)
~I<http://example2.com/Bar>
```


## Namespace delegator modules

Sometimes you want that modules of your application act as namespace modules. 
For example, when you are developing an application for which you have defined a dedicated vocabulary, you may not want to have a separate namespace for the vocabulary with the same name and provoke naming conflicts or confusion between the application and the RDF namespace module. In such cases, you can define a `RDF.Namespace` or `RDF.Vocabulary.Namespace` and specify with the `RDF.Namespace.act_as_namespace/1` macro, that another module should act as the specified RDF namespace.

```elixir
defmodule Example.NS do
  use RDF.Vocabulary.Namespace

  defvocab Example,
    base_iri: "http://www.example.com/ns/",
    terms: [:Foo, :bar]
end

defmodule Example do
  import RDF.Namespace

  act_as_namespace Example.NS.Example

  # your application functions
end
```

This definition allows you to use the `Example` module with your application functions as a full replacement for the `Example.NS.Example` vocabulary namespace:

```elixir
iex> Example.Foo |> Example.bar(42)
#RDF.Description<subject: ~I<http://www.example.com/ns/Foo>
  <http://www.example.com/ns/Foo>
      <http://www.example.com/ns/bar> 42 .
>
```

::: tip

The definition of a `RDF.Namespace` can be very useful in this context, when your application vocabulary spans multiple URI namespaces.

::: 

::: warning

Be aware that this also defines the functions for the lowercased terms (including the one and two argument variants from the [description DSL](description-and-graph-dsl.html#description-builder)) on this module, thus limiting your ability to use these names for business functions within this module.

:::

