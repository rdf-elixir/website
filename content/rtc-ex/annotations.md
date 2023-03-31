# Annotations

In the previous chapter we introduced the basic API for creating and working with compounds as plain sets of triples. Most of the time however, these sets of triples will be created just for the purpose of "shared annotations" about the whole set of triples.
For the remainder of this guide, we are using are more practical example to illustrate this core feature of RTC.

Suppose we get a dataset of statements about employees including detailed provenance metadata, which should be included in an existing knowledge graph. A description of an employee of this dataset might look like this:

```turtle
PREFIX : <http://www.example.org/>

:employee38
    :firstName "John" ;
    :familyName "Smith" ;
    :jobTitle "Assistant Designer" .
```

Let's assume in our example the records of the employees were entered via a form, so the provenance metadata targets these records and not the individual triples.

So, instead of annotating the individual triples like this:

```turtle
PREFIX :    <http://www.example.org/>

:employee38
    :firstName "John"              {| :statedBy :employee22; :statedAt "2022-02-16" |} ;
    :familyName "Smith"            {| :statedBy :employee22; :statedAt "2022-02-16" |} ;
    :jobTitle "Assistant Designer" {| :statedBy :employee22; :statedAt "2022-02-16" |} .
```

we'd like to use RTC compounds to represent these records and use them as the target of the provenance metadata:

```turtle
PREFIX : <http://www.example.org/>
PREFIX rtc: <https://w3id.org/rtc#>
 
:employee38 
    :firstName "John" ;
    :familyName "Smith" ;
    :jobTitle "Assistant Designer" .

:compound1 a rtc:Compound ;
    :statedBy :bob ; 
    :statedAt "2022-02-16" ;
    rtc:elements        
       << :employee38 :firstName "John" >> ,
       << :employee38 :familyName "Smith" >> ,
       << :employee38 :jobTitle "Assistant Designer" >> .
```

One terminological preliminary before we dig into the API to work with compound annotations. 
We're calling the description of the compound, i.e. the description of the set of triples, _annotations_.
We do that to differentiate these statements from the more extensive compound description, which is not only comprised of these annotations, but also the RTC statements from the RTC vocabulary, which are used to assign the triples to the compound and describe the sub-compound structure. 

So, while the full compound description in our example is this:

```turtle
:compound1 a rtc:Compound ;
    :statedBy :bob ; 
    :statedAt "2022-02-16" ;
    rtc:elements        
       << :employee38 :firstName "John" >> ,
       << :employee38 :familyName "Smith" >> ,
       << :employee38 :jobTitle "Assistant Designer" >> .
```

we're calling just the provenance metadata "annotations":

```turtle
:compound1 a rtc:Compound ;
    :statedBy :bob ; 
    :statedAt "2022-02-16" .
```

The annotation API of `RTC.Compound` only deals with this subset, while you don't see or have to deal with the RTC statements explicitly (as that's exactly what `RTC.Compound` does for you automatically).
Although this terminology seems to get in conflict with how RDF-star uses the term _annotation_, it is quite similar at heart: while the RDF-star annotations are the statements about triples, the RTC annotations are the "shared" statements about sets of triples.



## Creating annotations

Initial annotations can be set during the creation of a compound with the `:annotations` option as an `RDF.Description` or anything an `RDF.Description` can be built from. The subject in the input is ignored, so that the `RDF.Description` of any resource can be used as a blueprint.

```elixir
iex> compound = 
...>   EX.Employee38 
...>   |> EX.firstName("John")
...>   |> EX.familyName("Smith")
...>   |> EX.jobTitle("Assistant Designer")
...>   |> RTC.Compound.new(EX.Compound, annotations: %{
...>       EX.stateBy() => EX.Employee22, 
...>       EX.statedAt() => "2022-02-16"
...>      },
...>      prefixes: [ex: EX])
#RTC.Compound<id: ~I<http://example.com/Compound>
  @prefix ex: <http://example.com/> .
  @prefix rtc: <https://w3id.org/rtc#> .

  ex:Compound
      ex:stateBy ex:Employee22 ;
      ex:statedAt "2022-02-16" ;
      rtc:elements 
        << ex:Employee38 ex:familyName "Smith" >>, 
        << ex:Employee38 ex:firstName "John" >>, 
        << ex:Employee38 ex:jobTitle "Assistant Designer" >> .

  ex:Employee38
      ex:familyName "Smith" ;
      ex:firstName "John" ;
      ex:jobTitle "Assistant Designer" .
>

# These are alternative approaches producing the same compound
EX.Employee38 
|> EX.firstName("John")
|> EX.familyName("Smith")
|> EX.jobTitle("Assistant Designer")
|> RTC.Compound.new(EX.Compound, annotations: [
     {EX.stateBy(), EX.Employee22},
     {EX.statedAt(), "2022-02-16"}
   ])

EX.Employee38 
|> EX.firstName("John")
|> EX.familyName("Smith")
|> EX.jobTitle("Assistant Designer")
|> RTC.Compound.new(EX.Compound, annotations: 
     EX.Irrelevant 
     |> EX.stateBy(EX.Employee22)
     |> EX.statedAt("2022-02-16")
   )
```


## Accessing the annotations

As you can see above the annotations are stored under the `annotations` attribute in the compound struct as an `RDF.Description` with the compound id as its subject. However, it's not recommended to access this or any of the other attributes, but use the respective functions instead, in this case the `annotations/1` function. 

```elixir 
iex> RTC.Compound.annotations(compound)
#RDF.Description<subject: ~I<http://example.com/Compound>
  <http://example.com/Compound>
      <http://example.com/stateBy> <http://example.com/Employee22> ;
      <http://example.com/statedAt> "2022-02-16" .
>
```

Although, in this case the function seems to simply return the description from the attribute, this isn't always the case.

Annotations can be added to and deleted from a compound with the `add_annotations/2` and `delete_annotations/2` functions, which accept the annotations in the same formats as described above.

```elixir
iex> compound
...> |> RTC.Compound.add_annotations({EX.confidence(), 0.8}) 
...> |> RTC.Compound.annotations()
#RDF.Description<subject: ~I<http://example.com/Compound>
  <http://example.com/Compound>
      <http://example.com/confidence> 0.8 ;
      <http://example.com/stateBy> <http://example.com/Employee22> ;
      <http://example.com/statedAt> "2022-02-16" .
>

iex> compound
...> |> RTC.Compound.delete_annotations(EX.Irrelevant |> EX.statedAt("2022-02-16")) 
...> |> RTC.Compound.annotations()
#RDF.Description<subject: ~I<http://example.com/Compound>
  <http://example.com/Compound>
      <http://example.com/stateBy> <http://example.com/Employee22> .
>
```

