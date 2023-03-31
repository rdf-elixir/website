# Compound hierarchies

Compounds can also be nested inside of another. This has two effects:

1. A super-compound containing nested sub-compounds will also include all of the triples of the sub-compounds.
2. The sub-compound inherits all annotations of the super-compound.

Let's change our previous example of a dataset with descriptions of employees a bit to see where this can be useful. Let's suppose we're now getting the data in CSV like this:

```csv
Id,FirstName,LastName,JobTitle,AccordingTo
38,John,Smith,Assistant Designer,22
39,Jane,Doe,HR Manager,23
...
```

We might want to annotate all of these triples with some statements about the data source and create sub compounds to capture the value of the `AccordingTo` field for the triples from a row. This can be modeled with RTC using sub-compounds like this:

```turtle
PREFIX : <http://www.example.org/>
PREFIX rtc: <https://w3id.org/rtc#>
 
:employee38 
    :firstName "John" ;
    :familyName "Smith" ;
    :jobTitle "Assistant Designer" .

:employee39
    :firstName "Jane" ;
    :familyName "Doe" ;
    :jobTitle "HR Manager" .

:Compound1 a rtc:Compound ;
    :dataSource :DataSource1 .

:Compound2 
    rtc:subCompoundOf :Compound1 ;
    :accordingTo :employee22 ;
    rtc:elements        
       << :employee38 :firstName "John" >> ,
       << :employee38 :familyName "Smith" >> ,
       << :employee38 :jobTitle "Assistant Designer" >> .

:Compound3
    rtc:subCompoundOf :Compound1 ;
    :accordingTo :employee23 ;
    rtc:elements        
       << :employee39 :firstName "Jane" >> ,
       << :employee39 :familyName "Doe" >> ,
       << :employee39 :jobTitle "HR Manager" >> .
```
By defining `:Compound2` and `:Compound3` as sub-compounds of `:Compound1`, `:Compound1` implicitly contains all the triples of them and the sub-compounds all inherit the `:dataSource` annotation of `Compound1`.

::: warning

This modeling might be not be what you want in all circumstances. If we are only interested in the compounds as a bearer of shared annotations and want to reduce the amount of required triples to capture all of the metadata, this modeling is legitimate. But if we are interested in the compound as a graph we want to extend in the long-term with other imports, e.g. to query all of the `AccordingTo` triples of an employee across all imports, a better modeling would be to create a separate compound for each employee mentioned in `AccordingTo` and assign each of the triples to both the compound for the data source and the dedicated `AccordingTo` compound.

```turtle
PREFIX : <http://www.example.org/>
PREFIX rtc: <https://w3id.org/rtc#>
 
:employee38 
    :firstName "John" ;
    :familyName "Smith" ;
    :jobTitle "Assistant Designer" .

:employee39
    :firstName "Jane" ;
    :familyName "Doe" ;
    :jobTitle "HR Manager" .

:Compound1 a rtc:Compound ;
    :dataSource :DataSource1 .
    rtc:elements        
       << :employee38 :firstName "John" >> ,
       << :employee38 :familyName "Smith" >> ,
       << :employee38 :jobTitle "Assistant Designer" >> ,
       << :employee39 :firstName "Jane" >> ,
       << :employee39 :familyName "Doe" >> ,
       << :employee39 :jobTitle "HR Manager" >> .

:Compound2 
    :accordingTo :employee22 ;
    rtc:elements        
       << :employee38 :firstName "John" >> ,
       << :employee38 :familyName "Smith" >> ,
       << :employee38 :jobTitle "Assistant Designer" >> .

:Compound3
    :accordingTo :employee23 ;
    rtc:elements        
       << :employee39 :firstName "Jane" >> ,
       << :employee39 :familyName "Doe" >> ,
       << :employee39 :jobTitle "HR Manager" >> .
```
:::


## Creating nested compounds

The nested compound of our example can be created with `new/3` by specifying the sub-compounds via the `sub_compounds` option.

```elixir
iex> compound =
...>   RTC.Compound.new([], EX.Compound1,
...>     prefixes: [ex: EX],
...>     annotations: %{
...>       EX.dataSource() => EX.DataSource1
...>     },
...>     sub_compounds: [
...>       EX.Employee38
...>       |> EX.firstName("John")
...>       |> EX.familyName("Smith")
...>       |> EX.jobTitle("Assistant Designer")
...>       |> RTC.Compound.new(EX.Compound2,
...>         annotations: %{EX.accordingTo() => EX.Employee22}
...>       ),
...>       EX.Employee39
...>       |> EX.firstName("Jane")
...>       |> EX.familyName("Doe")
...>       |> EX.jobTitle("HR Manager")
...>       |> RTC.Compound.new(EX.Compound3,
...>         annotations: %{EX.accordingTo() => EX.Employee23}
...>       )
...>     ]
...>   )
#RTC.Compound<id: ~I<http://example.com/Compound1>
  @prefix ex: <http://example.com/> .
  @prefix rtc: <https://w3id.org/rtc#> .

  ex:Compound1
      ex:dataSource ex:DataSource1 .

  ex:Compound2
      ex:accordingTo ex:Employee22 ;
      rtc:elements 
        << ex:Employee38 ex:familyName "Smith" >>, 
        << ex:Employee38 ex:firstName "John" >>, 
        << ex:Employee38 ex:jobTitle "Assistant Designer" >> ;
      rtc:subCompoundOf ex:Compound1 .

  ex:Compound3
      ex:accordingTo ex:Employee23 ;
      rtc:elements 
        << ex:Employee39 ex:familyName "Doe" >>, 
        << ex:Employee39 ex:firstName "Jane" >>, 
        << ex:Employee39 ex:jobTitle "HR Manager" >> ;
      rtc:subCompoundOf ex:Compound1 .

  ex:Employee38
      ex:familyName "Smith" ;
      ex:firstName "John" ;
      ex:jobTitle "Assistant Designer" .

  ex:Employee39
      ex:familyName "Doe" ;
      ex:firstName "Jane" ;
      ex:jobTitle "HR Manager" .
>
```

Let's see if the first property of sub-compounds, that they are included in the set of triples of the super-compound, holds.

```elixir
iex> RTC.Compound.triples(compound)
[
  {~I<http://example.com/Employee38>, ~I<http://example.com/familyName>, ~L"Smith"},
  {~I<http://example.com/Employee38>, ~I<http://example.com/firstName>, ~L"John"},
  {~I<http://example.com/Employee38>, ~I<http://example.com/jobTitle>, ~L"Assistant Designer"},
  {~I<http://example.com/Employee39>, ~I<http://example.com/familyName>, ~L"Doe"},
  {~I<http://example.com/Employee39>, ~I<http://example.com/firstName>, ~L"Jane"},
  {~I<http://example.com/Employee39>, ~I<http://example.com/jobTitle>, ~L"HR Manager"}
]
```

If we only want to create a nested compound without annotations on the sub-compounds and we don't care about the id of the sub-compounds, we can use the first argument of `new/3` and nest the elements of the sub-compounds in an additional list. The sub-compounds are then created implicitly and their ids are generated with configured resource generator (see the [section "Auto-generated ids" in the Basic Graph API chapter](basic-graph-api.html#auto-generated-ids)).

```elixir
iex> [
...>   [
...>     EX.Employee38 
...>     |> EX.firstName("John")
...>     |> EX.familyName("Smith")
...>     |> EX.jobTitle("Assistant Designer")
...>   ],
...>   [
...>     EX.Employee39
...>     |> EX.firstName("Jane")
...>     |> EX.familyName("Doe")
...>     |> EX.jobTitle("HR Manager")
...>   ]
...> ]
...> |> RTC.Compound.new(EX.Compound1,
...>   prefixes: [ex: EX],    
...>   annotations: %{EX.dataSource() => EX.DataSource1}
...> )
#RTC.Compound<id: ~I<http://example.com/Compound1>
  @prefix ex: <http://example.com/> .
  @prefix rtc: <https://w3id.org/rtc#> .

  ex:Compound1
      ex:dataSource ex:DataSource1 .

  ex:Employee38
      ex:familyName "Smith" ;
      ex:firstName "John" ;
      ex:jobTitle "Assistant Designer" .

  ex:Employee39
      ex:familyName "Doe" ;
      ex:firstName "Jane" ;
      ex:jobTitle "HR Manager" .

  [
      rtc:elements 
        << ex:Employee38 ex:familyName "Smith" >>, 
        << ex:Employee38 ex:firstName "John" >>, 
        << ex:Employee38 ex:jobTitle "Assistant Designer" >> ;
      rtc:subCompoundOf ex:Compound1
  ] .

  [
      rtc:elements 
        << ex:Employee39 ex:familyName "Doe" >>, 
        << ex:Employee39 ex:firstName "Jane" >>, 
        << ex:Employee39 ex:jobTitle "HR Manager" >> ;
      rtc:subCompoundOf ex:Compound1
  ] .
>
```

The super-compounds a newly created compound should be derived from can be specified with the `:super_compounds` option of `new/3`. It accepts a single compound id of a super-compound or multiple compound ids as a list. Since the description of a super-compound with the annotations will be included in the annotation of the sub-compound, you can also provide one or multiple `RDF.Description`s of super-compounds. Finally, it is possible to provide the super-compounds directly, in which case only the ids and the annotations are extracted.

```elixir
iex> EX.Employee38
...> |> EX.firstName("John")
...> |> EX.familyName("Smith")
...> |> EX.jobTitle("Assistant Designer")
...> |> RTC.Compound.new(EX.Compound2,
...>   prefixes: [ex: EX],
...>   annotations: %{EX.accordingTo() => EX.Employee22},
...>   super_compounds: EX.Compound1 |> EX.dataSource(EX.DataSource1))
#RTC.Compound<id: ~I<http://example.com/Compound2>
  @prefix ex: <http://example.com/> .
  @prefix rtc: <https://w3id.org/rtc#> .

  ex:Compound1
      ex:dataSource ex:DataSource1 .

  ex:Compound2
      ex:accordingTo ex:Employee22 ;
      rtc:elements 
        << ex:Employee38 ex:familyName "Smith" >>, 
        << ex:Employee38 ex:firstName "John" >>, 
        << ex:Employee38 ex:jobTitle "Assistant Designer" >> ;
      rtc:subCompoundOf ex:Compound1 .

  ex:Employee38
      ex:familyName "Smith" ;
      ex:firstName "John" ;
      ex:jobTitle "Assistant Designer" .
>
```


## Accessing sub-compounds

All sub-compounds of a compound can be fetched with the `sub_compounds/1` function.

```elixir
iex> RTC.Compound.sub_compounds(compound)
[#RTC.Compound<id: ~I<http://example.com/Compound2>
  @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
  @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
  @prefix rtc: <https://w3id.org/rtc#> .
  @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

  <http://example.com/Compound1>
      <http://example.com/dataSource> <http://example.com/DataSource1> .

  <http://example.com/Compound2>
      <http://example.com/accordingTo> <http://example.com/Employee22> ;
      rtc:elements 
        << <http://example.com/Employee38> <http://example.com/familyName> "Smith" >>, 
        << <http://example.com/Employee38> <http://example.com/firstName> "John" >>, 
        << <http://example.com/Employee38> <http://example.com/jobTitle> "Assistant Designer" >> ;
      rtc:subCompoundOf <http://example.com/Compound1> .

  <http://example.com/Employee38>
      <http://example.com/familyName> "Smith" ;
      <http://example.com/firstName> "John" ;
      <http://example.com/jobTitle> "Assistant Designer" .
>,
 #RTC.Compound<id: ~I<http://example.com/Compound3>
  @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
  @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
  @prefix rtc: <https://w3id.org/rtc#> .
  @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

  <http://example.com/Compound1>
      <http://example.com/dataSource> <http://example.com/DataSource1> .

  <http://example.com/Compound3>
      <http://example.com/accordingTo> <http://example.com/Employee23> ;
      rtc:elements 
        << <http://example.com/Employee39> <http://example.com/familyName> "Doe" >>, 
        << <http://example.com/Employee39> <http://example.com/firstName> "Jane" >>, 
        << <http://example.com/Employee39> <http://example.com/jobTitle> "HR Manager" >> ;
      rtc:subCompoundOf <http://example.com/Compound1> .

  <http://example.com/Employee39>
      <http://example.com/familyName> "Doe" ;
      <http://example.com/firstName> "Jane" ;
      <http://example.com/jobTitle> "HR Manager" .
>]
```

A specific sub-compound can be fetched with the `sub_compound/2` function. With that, we can check for the second property of sub-compounds, that the annotations of the super-compound are inherited.


```elixir
iex> compound 
...> |> RTC.Compound.sub_compound(EX.Compound3)
...> |> RTC.Compound.annotations()
#RDF.Description<subject: ~I<http://example.com/Compound3>
  <http://example.com/Compound3>
      <http://example.com/accordingTo> <http://example.com/Employee23> ;
      <http://example.com/dataSource> <http://example.com/DataSource1> .
>
```

If you want to exclude inherited annotations you can use `annotations/2` function with the `:inherited` option set to `false` . The inherited annotations can be retrieved with the `inherited_annotations/1` function.

```elixir
iex> compound 
...> |> RTC.Compound.sub_compound(EX.Compound3)
...> |> RTC.Compound.annotations(inherited: false)
#RDF.Description<subject: ~I<http://example.com/Compound3>
  <http://example.com/Compound3>
      <http://example.com/accordingTo> <http://example.com/Employee23> .
>

iex> compound 
...> |> RTC.Compound.sub_compound(EX.Compound3)
...> |> RTC.Compound.inherited_annotations()
#RDF.Description<subject: ~I<http://example.com/Compound3>
  <http://example.com/Compound3>
      <http://example.com/dataSource> <http://example.com/DataSource1> .
>
```

Further sub-compounds can be added with the `put_sub_compound/2` function and existing ones can be removed with the `delete_sub_compound/2` function. As the name implies the `put_sub_compound/2` function overwrites any existing sub-compound with the given id.

```elixir
iex> compound
...> |> RTC.Compound.put_sub_compound(
...>     EX.Employee38 
...>     |> EX.firstName("John D.")
...>     |> EX.familyName("Smith")
...>     |> EX.jobTitle("Assistant Designer")
...>     |> RTC.Compound.new(EX.Compound2)
...>   )
...> |> RTC.Compound.delete_sub_compound(EX.Compound3)
#RTC.Compound<id: ~I<http://example.com/Compound1>
  @prefix ex: <http://example.com/> .
  @prefix rtc: <https://w3id.org/rtc#> .

  ex:Compound1
      ex:dataSource ex:DataSource1 .

  ex:Compound2
      rtc:elements 
        << ex:Employee38 ex:familyName "Smith" >>, 
        << ex:Employee38 ex:firstName "John D." >>, 
        << ex:Employee38 ex:jobTitle "Assistant Designer" >> ;
      rtc:subCompoundOf ex:Compound1 .

  ex:Employee38
      ex:familyName "Smith" ;
      ex:firstName "John D." ;
      ex:jobTitle "Assistant Designer" .
>
```

There's an almost similar set of functions for fetching super-compounds with a different semantics however. The `super_compounds/1` functions does not return the actual super-compound but only their ids. 

```elixir
iex> compound2 = RTC.Compound.sub_compound(compound, EX.Compound2)
...> RTC.Compound.super_compounds(compound2)
[~I<http://example.com/Compound1>]
```

That's because the `RTC.Compound` struct actually doesn't contain the super-compounds but only their ids and their inherited annotations. That's also the reason why there is no `super_compound/2` function. If you want to fetch the annotations of a specific super-compound, you can use the `inherited_annotations/2` function.

```elixir
iex> RTC.Compound.inherited_annotations(compound2, EX.Compound1)
#RDF.Description<subject: ~I<http://example.com/Compound1>
  <http://example.com/Compound1>
      <http://example.com/dataSource> <http://example.com/DataSource1> .
>
```

Although the `put_super_compound/2` function to add new or replace existing super-compound relationships also accepts `RTC.Compound` structs, it will only use the compound id and annotations of it. For that reason, you can also pass just the id of a compound or a `RDF.Description` with the annotations of the super-compound.

```elixir
iex> compound
...> |> RTC.Compound.put_super_compound(EX.Compound4)
...> |> RTC.Compound.put_super_compound(EX.Compound5 |> EX.p1(EX.O1))
...> |> RTC.Compound.put_super_compound(
...>     RTC.Compound.new([{EX.Wont, EX.be, EX.used}], EX.Compound6, 
...>       annotations: %{EX.p2() => EX.O2})
...>    )
#RTC.Compound<id: ~I<http://example.com/Compound1>
  @prefix ex: <http://example.com/> .
  @prefix rtc: <https://w3id.org/rtc#> .

  ex:Compound1
      ex:dataSource ex:DataSource1 ;
      rtc:subCompoundOf ex:Compound4, ex:Compound5, ex:Compound6 .

  ex:Compound2
      ex:accordingTo ex:Employee22 ;
      rtc:elements << ex:Employee38 ex:familyName "Smith" >>, << ex:Employee38 ex:firstName "John" >>, << ex:Employee38 ex:jobTitle "Assistant Designer" >> ;
      rtc:subCompoundOf ex:Compound1 .

  ex:Compound3
      ex:accordingTo ex:Employee23 ;
      rtc:elements << ex:Employee39 ex:familyName "Doe" >>, << ex:Employee39 ex:firstName "Jane" >>, << ex:Employee39 ex:jobTitle "HR Manager" >> ;
      rtc:subCompoundOf ex:Compound1 .

  ex:Compound5
      ex:p1 ex:O1 .

  ex:Compound6
      ex:p2 ex:O2 .

  ex:Employee38
      ex:familyName "Smith" ;
      ex:firstName "John" ;
      ex:jobTitle "Assistant Designer" .

  ex:Employee39
      ex:familyName "Doe" ;
      ex:firstName "Jane" ;
      ex:jobTitle "HR Manager" .
>
```

::: danger

The annotations of a super-compound are just used for the purpose of showing inherited annotations. They won't be rendered in `to_rdf/2`. So, you can't use `put_super_compound/2` to change the annotations of the super-compound itself. You'll have to load this super-compound with `from_rdf/2` and change its annotations directly.

:::

Finally, `delete_super_compound/2` to delete super-compound relationships works similar to `delete_sub_compound/2`.

```elixir
iex> RTC.Compound.delete_super_compound(compound2, EX.Compound1)
#RTC.Compound<id: ~I<http://example.com/Compound2>
  @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
  @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
  @prefix rtc: <https://w3id.org/rtc#> .
  @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

  <http://example.com/Compound2>
      <http://example.com/accordingTo> <http://example.com/Employee22> ;
      rtc:elements 
        << <http://example.com/Employee38> <http://example.com/familyName> "Smith" >>, 
        << <http://example.com/Employee38> <http://example.com/firstName> "John" >>, 
        << <http://example.com/Employee38> <http://example.com/jobTitle> "Assistant Designer" >> .

  <http://example.com/Employee38>
      <http://example.com/familyName> "Smith" ;
      <http://example.com/firstName> "John" ;
      <http://example.com/jobTitle> "Assistant Designer" .
>
```

