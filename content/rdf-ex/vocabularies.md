# Vocabularies

RDF.ex supports modules which represent RDF vocabularies as `RDF.Vocabulary.Namespace`s. It comes with predefined modules for some fundamental vocabularies defined in the `RDF.NS` module.

These `RDF.Vocabulary.Namespace`s allow for something similar to QNames in XML: an atom or function qualified with a `RDF.Vocabulary.Namespace` can be resolved to an IRI. 

There are two types of terms in a `RDF.Vocabulary.Namespace` which are
resolved differently:

1. Capitalized terms are by standard Elixir semantics module names, i.e.
   atoms. At all places in RDF.ex where an IRI is expected, you can use atoms
   qualified with a `RDF.Namespace` instead. If you want to resolve them
   manually, you can pass a `RDF.Namespace` qualified atom to `RDF.iri`.
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

As this example shows, the namespace modules can be easily `alias`ed. When required, they can be also aliased to a completely different name. Since the `RDF` vocabulary namespace in `RDF.NS.RDF` can't be aliased (it would clash with the top-level `RDF` module), all of its elements can be accessed directly from the `RDF` module (without an alias).

```elixir
iex> import RDF, only: [iri: 1]
iex> RDF.type
~I<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>

iex> iri(RDF.Property)
~I<http://www.w3.org/1999/02/22-rdf-syntax-ns#Property>
```

This way of expressing IRIs has the additional benefit, that the existence of the referenced IRI is checked at compile time, i.e. whenever a term is used that is not part of the resp. vocabulary an error is raised by the Elixir compiler (unless the vocabulary namespace is non-strict; see below).

For terms not adhering to the capitalization rules (lowercase properties, capitalized non-properties) or containing characters not allowed within atoms, the predefined namespaces in `RDF.NS` define aliases accordingly. If unsure, have a look at the documentation or their definitions. 


## Description DSL

The functions for the properties on a vocabulary namespace module, are also available in a description builder variant, which accepts subject and objects as arguments.

```elixir
RDF.type(EX.Foo, EX.Bar)
```

If you want to state multiple statements with the same subject and predicate, you can either pass the objects as a list or as additional arguments, if there are not more than five of them:

```elixir
RDF.type(EX.Foo, EX.Bar, EX.Baz)
EX.foo(EX.Bar, [1, 2, 3, 4, 5, 6])
```

In combination with Elixirs pipe operators this leads to a description DSL resembling [Turtle](https://www.w3.org/TR/turtle/):

```elixir
EX.Foo
|> RDF.type(EX.Bar)
|> EX.baz(1, 2, 3)
```

The produced statements are returned by this function as a `RDF.Description` structure which will be described below.


## Defining vocabulary namespaces

There are two basic ways to define a namespace for a vocabulary:

1. You can define all terms manually.
2. You can extract the terms from existing RDF data for IRIs of resources under the specified base IRI.

It's recommended to introduce a dedicated module for the defined namespaces. In this module you'll `use RDF.Vocabulary.Namespace` and define your vocabulary namespaces with the `defvocab` macro.

A vocabulary namespace with manually defined terms can be defined in this way like that:

```elixir
defmodule YourApp.NS do
  use RDF.Vocabulary.Namespace

  defvocab EX,
    base_iri: "http://www.example.com/ns/",
    terms: ~w[Foo bar]
    
end
```

The `base_iri` argument with the IRI prefix of all the terms in the defined
vocabulary is required and expects a valid IRI ending with either a `"/"` or
a `"#"`. Terms will be checked for invalid characters at compile-time and will raise a compiler error. This handling of invalid characters can be modified with the `invalid_characters` options, which is set to `:fail` by default. By setting it to `:warn` only warnings will be raised or it can be turned off completely with `:ignore`.

A vocabulary namespace with extracted terms can be defined either by providing RDF data directly with the `data` option or files with serialized RDF data in the `priv/vocabs` directory using the `file` option:

```elixir
defmodule YourApp.NS do
  use RDF.Vocabulary.Namespace

  defvocab EX,
    base_iri: "http://www.example.com/ns/",
    file: "your_vocabulary.nt"
    
end
```

During compilation the terms will be validated and checked for proper capitalisation by analysing the schema description of the resp. resource  in the given data.
This validation behaviour can be modified with the `case_violations` options, which is by default set to `:warn`. By setting it explicitly to `:fail` errors will be raised during compilation or it can be turned off with `:ignore`.

Invalid characters or violations of capitalization rules can be fixed by defining aliases for these terms with the `alias` option and a keyword list:

```elixir
defmodule YourApp.NS do
  use RDF.Vocabulary.Namespace

  defvocab EX,
    base_iri: "http://www.example.com/ns/",
    file: "your_vocabulary.nt"
    alias: [example_term: "example-term"]

end
```

The `:ignore` option allows to ignore terms:

```elixir
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

