# RDF-star

RDF.ex also supports the [RDF-star specification](https://w3c.github.io/rdf-star/cg-spec), an extension of RDF which adds the ability to make statements about other statements. This is achieved by extending the RDF data model to allow triples itself as subjects or objects of triples. 

::: warning

The specification process of RDF-star is still ongoing. 
So it might still be subject to breaking changes.

:::

Before we look at the implementation in RDF.ex some definition of terms we need.
A triple on the subject or object position of another triple is called a _quoted triple_.
A quoted triple must not necessarily also be asserted, i.e. be an element of an RDF graph other than as a quoted triple of one of its triples. But if the quoted triple is also part of the graph in an unquoted form, it is called an _asserted triple_.
A statement where either the subject or object is a quoted triple is called _RDF-star statement or triple_. 

An RDF-star statement in RDF.ex is an ordinary RDF.ex statement tuple where the subject or object is a RDF.ex triple itself.

```elixir
iex> RDF.triple({{EX.Employee38, EX.jobTitle(), "Assistent Designer"}, 
...>  EX.accordingTo(), EX.Employee22})
{{~I<http://example.com/Employee38>, ~I<http://example.com/jobTitle>,
  ~L"Assistent Designer"}, ~I<http://example.com/accordingTo>,
 ~I<http://example.com/Employee22>}
```

Just like that, wherever a subject or object term is expected, a triple can be given.

```elixir
iex> {EX.Employee38, EX.jobTitle(), "Assistent Designer"} |> EX.accordingTo(EX.Employee22)
#RDF.Description<subject: {~I<http://example.com/Employee38>, ~I<http://example.com/jobTitle>, ~L"Assistent Designer"}
  << <http://example.com/Employee38> <http://example.com/jobTitle> "Assistent Designer" >>
      <http://example.com/accordingTo> <http://example.com/Employee22> .
>

iex> RDF.graph() 
...> |> RDF.Graph.add({{EX.Employee38, EX.jobTitle(), "Assistent Designer"}, EX.accordingTo(), EX.Employee22})
...> |> RDF.Graph.get({EX.Employee38, EX.jobTitle(), "Assistent Designer"})
#RDF.Description<subject: {~I<http://example.com/Employee38>, ~I<http://example.com/jobTitle>, ~L"Assistent Designer"}
  << <http://example.com/Employee38> <http://example.com/jobTitle> "Assistent Designer" >>
      <http://example.com/accordingTo> <http://example.com/Employee22> .
>
```



## Annotation API

Although quoted triples can appear on both the subject and/or object position, they are used on the subject position most of the time. 
We call RDF-star statements like these, i.e. where the subject is a quoted triple, _annotations_.

::: warning

Note that this usage of the term annotation is slightly different from the one in the RDF-star spec, in which it is used in the annotation syntax of RDF-star Turtle to refer only to triples where the subject is an asserted triple, whereas we also call RDF-star statements annotations, in which the quoted triple is not asserted.

:::

The `RDF.Graph` module provides various functions which make working with annotations easier. The `RDF.Graph.add_annotations/3` allows to add a set of annotations, given as list or map of predicate-object pairs to a set of triples, given in any of the usual input form.

```elixir
iex> graph = 
...>   RDF.graph(prefixes: [ex: EX]) 
...>   |> RDF.Graph.add_annotations([
...>     {EX.S1, EX.p1(), EX.O1}, 
...>      EX.S2 |> EX.p2(["Foo", "Bar"])
...>   ], %{EX.ap1() => EX.AO1, EX.ap2() => EX.AO2})
#RDF.Graph<name: nil
  @prefix ex: <http://example.com/> .

  << ex:S1 ex:p1 ex:O1 >>
      ex:ap1 ex:AO1 ;
      ex:ap2 ex:AO2 .

  << ex:S2 ex:p2 "Bar" >>
      ex:ap1 ex:AO1 ;
      ex:ap2 ex:AO2 .

  << ex:S2 ex:p2 "Foo" >>
      ex:ap1 ex:AO1 ;
      ex:ap2 ex:AO2 .
>
```

The `RDF.Graph.put_annotations/3` and `RDF.Graph.put_annotation_properties/3` work similarly as the `RDF.Graph.put/2` and `RDF.Graph.properties/2` and overwrite either all existing annotations or just the ones with given predicates.

`RDF.Graph.delete_annotations/2` deletes all annotations of the a given set of statements, while `RDF.Graph.delete_annotations/2` deletes only those with the given predicate(s).

```elixir
iex> RDF.Graph.delete_annotations(graph, EX.S2 |> EX.p2(["Foo", "Bar"]))
#RDF.Graph<name: nil
  @prefix ex: <http://example.com/> .

  << ex:S1 ex:p1 ex:O1 >>
      ex:ap1 ex:AO1 ;
      ex:ap2 ex:AO2 .
>

iex> RDF.Graph.delete_annotations(graph, EX.S2 |> EX.p2(["Foo", "Bar"]), EX.ap1())
#RDF.Graph<name: nil
  @prefix ex: <http://example.com/> .

  << ex:S1 ex:p1 ex:O1 >>
      ex:ap1 ex:AO1 ;
      ex:ap2 ex:AO2 .

  << ex:S2 ex:p2 "Bar" >>
      ex:ap2 ex:AO2 .

  << ex:S2 ex:p2 "Foo" >>
      ex:ap2 ex:AO2 .
>
```

If you want to also assert the quoted triples when creating annotations, you can do so with the usual `RDF.Graph.add/3`, `RDF.Graph.put/3`, `RDF.Graph.put_properties/3` functions. All of them support the opts `:add_annotations`, `:put_annotations` and `:put_annotation_properties`, which add to annotations with the overwriting logic of the corresponding function.

```elixir
iex> graph = 
...>   RDF.graph(prefixes: [ex: EX]) 
...>   |> RDF.Graph.add([
...>     EX.S1 |> EX.p1(EX.O1),
...>     EX.S2 |> EX.p2(["Foo", "Bar"])],
...>     add_annotations: %{EX.ap1() => EX.AO1, EX.ap2() => EX.AO2})
#RDF.Graph<name: nil
  @prefix ex: <http://example.com/> .

  ex:S1
      ex:p1 ex:O1 {| ex:ap1 ex:AO1 ;
              ex:ap2 ex:AO2 |} .

  ex:S2
      ex:p2 "Bar" {| ex:ap1 ex:AO1 ;
              ex:ap2 ex:AO2 |},
          "Foo" {| ex:ap1 ex:AO1 ;
              ex:ap2 ex:AO2 |} .
>

iex> RDF.Graph.put(graph, EX.S2 |> EX.p2(["Foo", "Baz"]),
...>   put_annotation_properties: %{EX.ap2() => EX.AO3})
#RDF.Graph<name: nil
  @prefix ex: <http://example.com/> .

  ex:S1
      ex:p1 ex:O1 {| ex:ap1 ex:AO1 ;
                     ex:ap2 ex:AO2 |} .

  ex:S2
      ex:p2 "Baz" {| ex:ap2 ex:AO3 |},
            "Foo" {| ex:ap1 ex:AO1 ;
                     ex:ap2 ex:AO3 |} .

  << ex:S2 ex:p2 "Bar" >>
      ex:ap1 ex:AO1 ;
      ex:ap2 ex:AO2 .
>
```

On `RDF.Graph.put/3` and `RDF.Graph.put_properties/3`, you can also specify what should happen with the annotations of the triples which got deleted through the overwrite with various options. 
The `:delete_annotations_on_deleted` keyword option allows to say that all of these annotations should be deleted by providing the value `true`. 

```elixir
iex> RDF.Graph.put(graph, EX.S2 |> EX.p2(["Foo", "Baz"]),
...>   put_annotation_properties: %{EX.ap2() => EX.AO3},
...>   delete_annotations_on_deleted: true)
#RDF.Graph<name: nil
  @prefix ex: <http://example.com/> .

  ex:S1
      ex:p1 ex:O1 {| ex:ap1 ex:AO1 ;
                     ex:ap2 ex:AO2 |} .

  ex:S2
      ex:p2 "Baz" {| ex:ap2 ex:AO3 |},
            "Foo" {| ex:ap1 ex:AO1 ;
                     ex:ap2 ex:AO3 |} .
>
```

Alternatively, a selection of the properties of the annotations to be deleted can be provided as the value of the `:delete_annotations_on_deleted` keyword.
 
The `:add_annotations_on_deleted`, `:put_annotations_on_deleted`,
  `:put_annotation_properties_on_deleted` allow to provide annotations, which should be add about the deleted statements with the respective overwrite logic.

```elixir
iex> RDF.Graph.put(graph, EX.S2 |> EX.p2(["Foo", "Baz"]),
...>   put_annotation_properties: %{EX.ap2() => EX.AO4},
...>   put_annotations_on_deleted: %{EX.ap3() => EX.AO3})
#RDF.Graph<name: nil
  @prefix ex: <http://example.com/> .

  ex:S1
      ex:p1 ex:O1 {| ex:ap1 ex:AO1 ;
                     ex:ap2 ex:AO2 |} .

  ex:S2
      ex:p2 "Baz" {| ex:ap2 ex:AO4 |},
            "Foo" {| ex:ap1 ex:AO1 ;
                     ex:ap2 ex:AO4 |} .

  << ex:S2 ex:p2 "Bar" >>
      ex:ap3 ex:AO3 .
>
```

On the `RDF.Graph.delete/3` and `RDF.Graph.delete_descriptions/3` functions, you have similar keyword options available to specify the handling of the annotations of the deleted statements.
The `:delete_annotations` keyword option allows to set which of the annotations of the deleted statements should be deleted. Again, either only those with a specific set of properties or all with the `true` value. By default no annotations of the deleted statements will be removed.
Alternatively, the `:add_annotations`, `:put_annotations` or `:put_annotation_properties` keyword options can be used to add annotations about the deleted statements with the respective overwrite logic.

```elixir
iex> RDF.Graph.delete(graph, {EX.S1, EX.p1(), EX.O1}, 
...>   delete_annotations: true)
#RDF.Graph<name: nil
  @prefix ex: <http://example.com/> .

  ex:S2
      ex:p2 "Bar" {| ex:ap1 ex:AO1 ;
                     ex:ap2 ex:AO2 |},
            "Foo" {| ex:ap1 ex:AO1 ;
                     ex:ap2 ex:AO2 |} .
>
```

The `RDF.Graph.annotations/1` function returns a graph with just the annotations of the given graph.

```elixir
iex> RDF.Graph.annotations(graph)
#RDF.Graph<name: nil
  @prefix ex: <http://example.com/> .

  << ex:S1 ex:p1 ex:O1 >>
      ex:ap1 ex:AO1 ;
      ex:ap2 ex:AO2 .

  << ex:S2 ex:p2 "Bar" >>
      ex:ap1 ex:AO1 ;
      ex:ap2 ex:AO2 .

  << ex:S2 ex:p2 "Foo" >>
      ex:ap1 ex:AO1 ;
      ex:ap2 ex:AO2 .
>
```

The `RDF.Graph.without_annotations/1` functions does the opposite and returns the graph without annotations.

```elixir
iex> RDF.Graph.without_annotations(graph)
#RDF.Graph<name: nil
  @prefix ex: <http://example.com/> .

  ex:S1
      ex:p1 ex:O1 .

  ex:S2
      ex:p2 "Bar", "Foo" .
>
```

If you also want to get the graph with all RDF-star statements filtered, i.e. also those with quoted triples on object positions removed, you have to use the `RDF.Graph.without_star_statements/1` function. This function however is significantly slower, since it requires a full walk-through of the graph. 

When you want to process all triples of a graph without RDF-star statements, you don't have to use the `RDF.Graph.without_star_statements/1` function, but can use `RDF.Graph.statements/1` function (or its `RDF.Graph.triples/1` alias) instead and set the `:filter_star` keyword option to `true`. 
The `RDF.Description.statements/1` and `RDF.Dataset.statements/1` functions also support this option.



## Querying

[SPARQL.ex](/sparql-ex/) does not have SPARQL-star support yet.
However, the BGP query engine built into RDF.ex (accessible via `RDF.Graph.query/2`; see [here](/rdf-ex/data-structures.html#querying-graphs) for more), fully supports RDF-star triples and RDF-star triple patterns.

```elixir
iex> graph = RDF.graph({{EX.Employee38, EX.jobTitle(), "Assistent Designer"}, 
...>  EX.accordingTo(), EX.Employee22})
iex> RDF.Graph.query(graph, {{:s?, :_p, :_o}, EX.accordingTo(), EX.Employee22})
[%{s: ~I<http://example.com/Employee38>}]
```



## Serializations

The serialization formats within RDF.ex all support the respective RDF-star extensions: N-Triples-star, N-Quads-star and Turtle-star. They are part of the implementation of the respective base formats. So, you can use the respective functions as described in the chapter on [Serializations](/rdf-ex/serializations).
When a RDF graph or dataset includes RDF-star statements they will be automatically encoded with the RDF-star extension. 
If you want an RDF-star graph to be encoded in a standard RDF serialization format, just remove the RDF-star statements as described above.



## Disabling RDF-star support

If you don't want RDF-star support, but want all attempts to add statements with quoted triples to result in an error, you can disable RDF-star support in your application configuration like this:

```elixir
config :rdf,
  star: false
```


