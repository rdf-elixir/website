# Schemas

A **_Grax schema_** is just an Elixir struct. In a traditional application, backed by a relational data model, you want to work with Elixir structs with the values from the relational database. You'll probably do this traditionally in Elixir with Ecto, by defining some `Ecto.Schema`s for the domain entities of your business. `Grax.Schema`s are similar to `Ecto.Schema`s, they both map the data to Elixir structs with some semantics on top of them, like a type system etc.

But while Ecto maps data from relational databases, Grax maps data from graph databases to Elixir structs. Graph databases are based on the graph data model, which has less technical friction between the conceptual model of the humans and the data model for the machine as it is perfectly [demonstrated here](https://youtu.be/cHXbYLNa0qQ?t=290). By reducing the barrier between your conceptual models and the data models for your application, you have less to think about technical details and can spend more time on thinking about the actual domain model of the business problems your application has to solve.
You might have already got a feel of this, when working with GraphQL, where you simply define the nested schemas of a tree.

How does a `Grax.Schema` definition look like? As an example, let's assume we have an RDF graph like this, which we want to map to Elixir structs with Elixir values for an Elixir application:

```
@prefix : <http://example.com/> .
@prefix schema: <https://schema.org/> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .

:User1 
    a schema:Person, :PremiumUser ;
    schema:name "Jane" ;
    schema:email "jane@example.com", "jane@work.com" ;
    foaf:age 30 ;
    schema:address [
      schema:addressCountry "de"
      schema:addressLocality "Berlin"
    ] .

:Post1
    schema:name "Lorem" ;
    schema:author :User1 ;
    schema:articleBody """Lorem ipsum dolor sit amet, consectetur adipisicing elit. Provident, nihil, dignissimos. Nesciunt aut totam eius. Magnam quaerat modi vel sed, ipsam atque rem, eos vero ducimus beatae harum explicabo labore!""" .
```

A Grax schema struct for the `User` model of an application on this type of data could be defined with the `schema/1` macro of the `Grax.Schema` module like this:

```elixir
defmodule User do
  use Grax.Schema

  schema do
    # ...
  end
end
```

This will define a struct on the `User` module. Although this struct doesn't have any user-defined fields for the domain model of our application yet, this could already represent an RDF graph node, since every `Grax.Schema` struct has at least an internal `__id__`  field, which contains the `RDF.IRI` or `RDF.BlankNode`, mapping to a graph node. It also contains an `__additional_statements__` field, which keeps the statements about the subject with properties not part of the Grax schema as a map with the predicate-objects pairs. 

So, an instance of this struct would look like this:

```elixir
alias NS.EX

%User{__id__: RDF.iri(EX.User1), __additional_statements__: %{}}
%Address{__id__: ~B<Address1>, __additional_statements__: %{}}
```

The structs in the `__id__` field from RDF.ex are the only RDF-related values you'll see in a Grax schema struct. The `__id__` field should be treated similarly as the internal `__struct__` field of Elixir structs: use it maybe for pattern matching, but don't touch it directly (other than via functions exposed by the API). 

More on the treatment of additional statements in the [API chapter](api). For the rest of this chapter, we won't show the `__additional_statements__` field anymore.

::: tip

The `schema` macro can be considered equal to a `defstruct` in that it allows to define every struct which can be defined with it. Under the hood it will produce the `defstruct` call as the first line of the generated code, which means you can use all types of annotations before the `schema` macro that can be used before a `defstruct`, eg. `@derive` annotations etc.

:::

But without any fields this isn't very interesting.


### Properties

As opposed to the term "field" used for the elements of Elixir structs and `Ecto.Schema`s, we are calling the elements of the `Grax.Schema` struct **_properties_**, because we're mapping them to RDF properties. Unlike for fields of an Ecto schema, we'll not just have to provide a name atom for our property fields, but also a URI for the RDF property.

So, a property definition on a Grax schema is done in the body of a `schema/1` block with the `property/3` macro and the property field name and a RDF property URI as the first two arguments.

```elixir
defmodule User do
  use Grax.Schema

  schema do
    property :name, ~I<http://example.com/property>
  end
end
```

This will add an additional field on the Grax schema struct with the given name. The URI of the RDF property will be backed into the Grax schema struct. You won't have to deal with the URIs of the RDF properties furthermore. It will be automatically used for the mapping from and to RDF.

The URI can be given in any form the `RDF.IRI.new/1` constructor of RDF.ex can create IRIs from, including IRIs directly (eg. via IRI sigils), strings or terms from an RDF.ex vocabulary namespace.


```elixir
defmodule User do
  use Grax.Schema

  alias NS.SchemaOrg

  schema do
    property :name, SchemaOrg.name
  end
end
```

::: warning

We'll constantly use terms from RDF.ex vocabulary namespaces. These are modules and functions on these modules, which can be used instead of URIs in the Elixir code. If you're new to RDF.ex, you can read more about this [here](/rdf-ex/namespaces).
:::

You can also define properties in a more concise form with the `property/1` macro:

```elixir
defmodule Example do
  use Grax.Schema

  alias NS.SchemaOrg

  schema do
    property name: SchemaOrg.name
  end
end
```

In this form the first keyword list element has this special meaning of a field name to property URI pair. 

All of these definition forms lead to structs like this:

```elixir
%User{
  __id__: RDF.iri(EX.User1), 
  name: "Jane"
}
```

The property is accessible as a usual field name of the struct, but has an exact RDF interpretation implicitly through the internal mapping to an RDF property identifier. These minimal forms without any further type specifications are already valid property definitions in Grax. Unlike an Ecto schema, where every field requires a type, for a Grax schema the types are optional, just as RDF and most other graph models are at its core schema-free data models with optional types later on. 

But before we bring types into the game, we'll have to differentiate two general kinds of properties: 

1. **_Data properties_**, whose values we want to map to simple Elixir values, like strings and integers etc.
2. **_Link properties_** (the _object properties_ of OWL), whose IRI or blank node values should be mapped to recursively nested `Grax.Schema` structs.

Despite having very different kinds of values, there's one type dichotomy across both kinds of properties. We can have single values or sets of values.

By default it is assumed that the value of every property is unique, unless specified otherwise. If multiple values are allowed, a list type can be specified with the `list_of` type constructor function, which expects the type of its elements. The values will then be kept in a list accordingly. If you want to specify that a property can have multiple values of any datatype you can use the `list` function.

With that we can extend our example mapping schema like this:

```elixir
defmodule User do
  use Grax.Schema

  alias NS.{SchemaOrg, FOAF}

  schema do
    property :name, SchemaOrg.name, type: :string
    property :emails, SchemaOrg.email, type: list_of(:string)
  end
end
```

Both email addresses from our example can now be represented in our `User` struct:

```elixir
%User{
  __id__: RDF.iri(EX.User1),
  name: "Jane",
  emails: ["jane@example.com", "jane@work.com"]
}
```

::: warning

Although ordered lists are used for multiple values, the order is irrelevant since the values have no particular order in RDF. You should not rely on any particalur order. Similarly, as the values are essentially sets, duplicates are not allowed. They will be removed automatically.

:::


## Data properties

### Datatypes

The optional type specifications on our two kinds of properties are fundamentally different. The types of data properties defined with the `property` macros can be specified by providing the name of a datatype with the `:type` keyword.

```elixir
defmodule User do
  use Grax.Schema

  alias NS.{SchemaOrg, FOAF}

  schema do
    property :name, SchemaOrg.name, type: :string
    property :emails, SchemaOrg.email, type: list_of(:string)
    property :age, FOAF.age, type: :integer
  end
end
```

The specified datatype defines what value a data property can have and which RDF datatype the produced literals for the RDF property should have. 
The functions for working with these structs will validate these type definitions as described in the [Grax API section](/grax/api).

The `User` structs now look like this:

```elixir
%User{
  __id__: RDF.iri(EX.User1),
  name: "Jane",
  emails: ["jane@example.com", "jane@work.com"],
  age: 30
}
```

The types are given as atoms which correspond to the respective RDF.ex literal datatypes. Since RDF.ex implements the main parts of the XSD datatype system, a fairly rich set of types of values is type-derivation-aware available.

|      Grax datatype      |   RDF.ex literal datatype    |
|-------------------------|------------------------------|
| `:any_uri`              | `RDF.XSD.AnyURI`             |
| `:base64_binary`        | `RDF.XSD.Base64Binary`       |
| `:boolean`              | `RDF.XSD.Boolean`            |
| `:byte`                 | `RDF.XSD.Byte`               |
| `:date`                 | `RDF.XSD.Date`               |
| `:date_time`            | `RDF.XSD.DateTime`           |
| `:decimal`              | `RDF.XSD.Decimal`            |
| `:double`               | `RDF.XSD.Double`             |
| `:float`                | `RDF.XSD.Float`              |
| `:int`                  | `RDF.XSD.Int`                |
| `:integer`              | `RDF.XSD.Integer`            |
| `:long`                 | `RDF.XSD.Long`               |
| `:negative_integer`     | `RDF.XSD.NegativeInteger`    |
| `:non_negative_integer` | `RDF.XSD.NonNegativeInteger` |
| `:non_positive_integer` | `RDF.XSD.NonPositiveInteger` |
| `:positive_integer`     | `RDF.XSD.PositiveInteger`    |
| `:short`                | `RDF.XSD.Short`              |
| `:string`               | `RDF.XSD.String`             |
| `:time`                 | `RDF.XSD.Time`               |
| `:unsigned_byte`        | `RDF.XSD.UnsignedByte`       |
| `:unsigned_int`         | `RDF.XSD.UnsignedInt`        |
| `:unsigned_long`        | `RDF.XSD.UnsignedLong`       |
| `:unsigned_short`       | `RDF.XSD.UnsignedShort`      |

::: warning

The XSD date and time datatypes support also optional timezones, which are not supported by Elixir's `Date` and `Time` structs. Such date and time values with timezones are represented as tuples consisting of the `Date` and `Time` struct value and a string with the timezone, such as `{~D[2020-12-24], "+01:00"}` or `{~T[00:00:00], "Z"}`.

:::

Above these there are a couple of special datatypes:

- The `:any` datatype is the default when no datatype is specified with the `:type` keyword or is assumed for the the elements when using the `list` type constructor function. It means the property can contain values of any datatype. The datatype mapping from Elixir values to XSD datatypes as described in [the table here](/rdf-ex/literals.html#typed-literals) is applied in this case.

- The `:numeric` datatype behaves similar to the `:any` datatype, but limits the values to those of numeric datatypes.

- The `:iri` datatype can be used if IRIs should be kept as they are, which is useful when they shouldn't be mapped to nested mapping structs.


### Default values

Default values for the data properties can be defined with the `:default` option. Its value is used as the default value of the Elixir struct.
If not specified otherwise, the default value will be `nil`, just like the default value on any Elixir struct, for single value properties. But for properties with multiple values it will be the empty list by default. 

Generally, if a `:type` is defined, the `:default` value must match this datatype. Otherwise it won't compile.


## Link properties

Now, back to our two kinds of properties, we'll see how link properties are mapped to other Grax schemas. 

Link properties, in the following sometimes called more shortly links, are the edges of an RDF graph between the inner nodes with URIs or blank nodes, as opposed to data properties which are the edges to leaf nodes with RDF literals. Other than for data properties, the actual value of a link property with a node identifier is not of primary interest, but it's the description of the thing the identifier refers to. So, the values of link properties are not the URIs or blank nodes in the object position of an RDF statement, but another Grax schema with the properties from the RDF description of the linked resource.

Just like the relational associations in Ecto are mapped to the struct fields through another Ecto schema for the associated table, the linked resources of a root resource are embedded into the struct in the respective field, where the properties of the linked resource are kept, potentially linking to other resources. So, the links allow us to traverse the nodes of a graph, as a tree structure down from a root resource and its fields of nested `Grax.Schema` structs.

A Grax link can be defined in a Grax `schema` definition with another macro specifically for link properties: the `link/3` macro. 
It has almost the same interface as the `property/3` macro. The first two arguments are again for the name and IRI of the property.
The `:type` option however has a different meaning and is no longer optional. It must be the module name of another `Grax.Schema` struct.

```elixir{11}
defmodule User do
  use Grax.Schema

  alias NS.SchemaOrg

  schema do
    property :name, SchemaOrg.name, type: :string, required: true
    property :emails, SchemaOrg.email, type: list_of(:string), required: true
    property :age, FOAF.age, type: :integer

    link :address, SchemaOrg.address, type: Address
  end
end

defmodule Address do
  use Grax.Schema

  alias NS.SchemaOrg

  schema do
    property :country, SchemaOrg.addressCountry, type: :string
    property :city, SchemaOrg.addressLocality, type: :string
    property :street, SchemaOrg.streetAddress, type: :string
  end
end
```

Just like the `property` macro, there is also a `link/1` variant, allowing to define the link more succinctly.

```elixir
defmodule User do
  use Grax.Schema

  alias NS.SchemaOrg

  schema do
    link address: SchemaOrg.address, type: Address
  end
end
```

So, our `User` struct now looks like this:

```elixir
%User{
  __id__: RDF.iri(EX.User1),
  name: "Jane",
  emails: ["jane@example.com", "jane@work.com"],
  age: 30,
  address: %Address{
    __id__: RDF.blank_node("b1"),
    country: "de",
    city: "Berlin",
    street: nil
  }
}
```

While you have to deal in Ecto with the relational data model with different types of associations and mappings in the relational data model (1-to-1, 1-to-n, n-to-m, with an implicit or explicit join-schema etc.), the graph data model just has edges with different kinds of cardinalities, which are in Grax mapped to either single values or a list of multiple values, just like data properties, only that it's now single or multiple schema structs for the linked nodes.
Just as for data properties single linked schema structs are assumed unless the list type is set on the  `:type` keyword with the `list_of` function and the module name of the schema. 

```elixir
defmodule User do
  use Grax.Schema

  alias NS.{SchemaOrg, FOAF}

  schema do
    property :name, SchemaOrg.name, type: :string, required: true
    property :emails, SchemaOrg.email, type: list_of(:string), required: true
    property :age, FOAF.age, type: :integer
    
    link address: SchemaOrg.address, type: Address
    link friends: FOAF.friend, type: list_of(User)
  end
end
```

But as you might see already with this link property, there's one problem we'll have to solve.


### Preloading

Preloading is the operation of populating a `Grax.Schema` struct by loading (mapping) the RDF descriptions of linked resources from an RDF graph into a tree structure over the linked property fields of a `Grax.Schema` recursively.

You might have already asked yourself, how the recursive traversal of the graph for loading the nested schema of a root node is done and can be controlled. 
For example on our `friends` link: How many levels of friends do we want to load and how do we handle circles?

There are potentially several useful preloading strategies, which should be implemented in possible future versions. For now, the only preloading strategy supported is a pretty simple one, the _depth preloading_ strategy, where all of the properties and links up to a specified recursive depth are loaded. 

The default behaviour for how deep the links of a mapping struct are loaded can be specified on a `link` definition with the `:depth` keyword of the depth preloading strategy and an integer for the preloading depth. 
But before we look at a use of the `:depth` keyword, let's see what happens if our address model would get further nested by decomposing one of its parts, eg. the country. 

```elixir
defmodule User do
  use Grax.Schema

  alias NS.SchemaOrg

  schema do
    property name: SchemaOrg.name, type: :string, required: true
    property emails: SchemaOrg.email, type: list_of(:string), required: true
    property age: FOAF.age, type: :integer

    link :address, SchemaOrg.address, type: Address
  end
end

defmodule Address do
  use Grax.Schema

  alias NS.SchemaOrg

  schema do
    property street: SchemaOrg.streetAddress, type: :string
    property city: SchemaOrg.addressLocality, type: :string

    link country: SchemaOrg.addressCountry, type: Country
  end
end

defmodule Country do
  use Grax.Schema

  alias RDF.NS.RDFS
  alias NS.GeoNames

  schema do
    property name: RDFS.label, type: :string
    property code: GeoNames.countryCode, type: :string
  end
end
```


The default value for `:depth` is `1`. This means all of the data and object properties are loaded, including the nested `Grax.Schema` mapping with the descriptions of a linked resource, BUT NOT the linked `Grax.Schema` structs of these nested `Grax.Schema` structs. These would only be preloaded if the depth was larger than one. So, without a further specification of the preloading depth, our `User` struct would look like this:

```elixir{10}
%User{
  __id__: RDF.iri(EX.User1),
  name: "Jane",
  emails: ["jane@example.com", "jane@work.com"],
  age: 30,
  address: %Address{
    __id__: ~B"b1",
    city: "Berlin",
    street: nil,
    country: ~I<http://www.wikidata.org/entity/Q183>
  }
}
```

When loading a `Grax.Schema` struct, the fields for the links which are not loaded just have their node identifier as a value.
If you've got a `Grax.Schema` struct with `RDF.IRI`s or `RDF.BlankNode`s like this on the link field and want to access the referenced recource, you'll have to do an explicit call of the `Grax.preload/3` function described in the next chapter about the API.

But to ensure a proper processing of the Grax schema structs, which might expect certain fields in deeper layers of the struct, you don't want to check for these values and have to do a manual preload. In cases like this, you can enforce the depth of the preloading with the `:depth` keyword. This can be achieved in multiple ways.
 
The first approach might be to increase the depth on the `address` link to 2. 

```elixir{11}
defmodule User do
  use Grax.Schema

  alias NS.SchemaOrg

  schema do
    property name: SchemaOrg.name, type: :string, required: true
    property emails: SchemaOrg.email, type: list_of(:string), required: true
    property age: FOAF.age, type: :integer

    link :address, SchemaOrg.address, type: Address, depth: 2
  end
end

defmodule Address do
  use Grax.Schema

  alias NS.SchemaOrg

  schema do
    property street: SchemaOrg.streetAddress, type: :string
    property city: SchemaOrg.addressLocality, type: :string

    link country: SchemaOrg.addressCountry, type: Country
  end
end
```

Given respective data in a source graph our `User` struct could now look like this:

```elixir{10-14}
%User{
  __id__: RDF.iri(EX.User1),
  name: "Jane",
  emails: ["jane@example.com", "jane@work.com"],
  age: 30,
  address: %Address{
    __id__: ~B"b1",
    city: "Berlin",
    street: nil,
    country: %Country{
      __id__: ~I<http://www.wikidata.org/entity/Q183>,
      name: "Germany",
      code: "DE"
    }
  }
}
```

But we would get this result only if the `User` struct is the root resource.
A normal preloading depth integer value is interpreted against the root element. This means, when loading the schema from a graph, only the specified `:depth` of the root resource is relevant. The `:depth` specified in the schema of a linked resource is not taken into account and doesn't increase the overall preloading depth. This can be achieved however, by specifying a preloading depth with a plus sign before the `:depth` integer value, like `depth: +1` . This _additive_ preloading depth will ensure that these resources are preloaded with the specified level even when the `:depth` of the outer schema would specify otherwise.
So, this essentially overwrites the preloading depth specification of the parent schema.

Back to our example, when we generally expect that code dealing with an address in our application is interested in the properties of the country, we want to achieve that the country is always preloaded with the address, independent of whether it is preloaded as part of another resource. This can be specified with an additive preloading depth.

```elixir{11,24}
defmodule User do
  use Grax.Schema

  alias NS.SchemaOrg

  schema do
    property name: SchemaOrg.name, type: :string, required: true
    property emails: SchemaOrg.email, type: list_of(:string), required: true
    property age: FOAF.age, type: :integer

    link :address, SchemaOrg.address, type: Address
  end
end

defmodule Address do
  use Grax.Schema

  alias NS.SchemaOrg

  schema do
    property street: SchemaOrg.streetAddress, type: :string
    property city: SchemaOrg.addressLocality, type: :string

    link country: SchemaOrg.addressCountry, type: Country, depth: +1
  end
end
```

If all link properties of a schema should have the same preloading depth, the `:depth` keyword can also be specified on the `use Graph.Schema` call.

```elixir{11,16,24}
defmodule User do
  use Grax.Schema

  alias NS.SchemaOrg

  schema do
    property name: SchemaOrg.name, type: :string, required: true
    property emails: SchemaOrg.email, type: list_of(:string), required: true
    property age: FOAF.age, type: :integer

    link :address, SchemaOrg.address, type: Address
  end
end

defmodule Address do
  use Grax.Schema, depth: +1

  alias NS.SchemaOrg

  schema do
    property street: SchemaOrg.streetAddress, type: :string
    property city: SchemaOrg.addressLocality, type: :string

    link country: SchemaOrg.addressCountry, type: Country
  end
end
```

But additive preloading depths can lead to infinite preloading circles. This is prohibited by stopping with the preloading down a path, when the first already preloaded element on this path reoccurs.

This a pretty greedy preloading strategy. But in the first version, which is limited to working on in-memory RDF.ex graphs, where loading is quite fast and the data access doesn't require any further IO, this simple strategy gets us already quite far.


### Inverse property links

Sometimes we want to define a `link` on a `Grax.Schema` for which no RDF property exists directly. For example, in our data there is no property linking a user to a post directly. Instead there is the `schema:author`property which links a post to its authors, so exactly the inverse property of what we want. You can specify a link property on a `Grax.Schema` in those cases by declaring it as an inverse property with a minus sign before the IRI of the inverse property.

```elixir{12}
defmodule User do
  use Grax.Schema

  alias NS.{SchemaOrg, FOAF}

  schema do
    property name: SchemaOrg.name, type: :string, required: true
    property emails: SchemaOrg.email, type: list_of(:string), required: true
    property age: FOAF.age, type: :integer
    
    link friends: FOAF.friend, type: list_of(User)
    link posts: -SchemaOrg.author, type: list_of(Post)
  end
end

defmodule Post do
  use Grax.Schema

  alias NS.SchemaOrg

  schema do
    property title: SchemaOrg.name(), type: :string
    property content: SchemaOrg.articleBody(), type: :string

    link author: SchemaOrg.author(), type: User
  end
end
```

## Cardinalities

You can define the cardinality the values of data properties and links of a schema must have in order to be considered valid. For non-list properties there are just two possible cardinalities: 1 or 0..1 or, in other words, required or not, which can be specified with the `:required` option defaulting to `false`.

```elixir
defmodule User do
  use Grax.Schema

  alias NS.{SchemaOrg, FOAF}

  schema do
    property name: SchemaOrg.name, type: :string, required: true
    property emails: SchemaOrg.email, type: list_of(:string)
    property age: FOAF.age, type: :integer
  end
end
```

For list properties you can specify the cardinality on the `list` resp. `list_of` type constructor functions with the `:card` option. It can have 

- a single integer value for an exact cardinality, 
- an Elixir range value (like `1..3`) for a cardinality with an lower and upper boundary,
- or a `{:min, n}` tuple value with an integer for a minimal cardinality without an upper boundary

```elixir
defmodule User do
  use Grax.Schema

  alias NS.{SchemaOrg, FOAF}

  schema do
    property name: SchemaOrg.name, type: :string, required: true
    property emails: SchemaOrg.email, type: list_of(:string, card: {:min, 1})
    property age: FOAF.age, type: :integer
  end
end
```

The `{:min, 1}` cardinality can be specified also by using the `:required` option on a list type. So, this is equivalent to the former definition:

```elixir
defmodule User do
  use Grax.Schema

  alias NS.{SchemaOrg, FOAF}

  schema do
    property name: SchemaOrg.name, type: :string, required: true
    property emails: SchemaOrg.email, type: list_of(:string), required: true
    property age: FOAF.age, type: :integer
  end
end
```


## Class declarations

You can optionally specify that the individual `Grax.Schema` structs representing RDF resources should be instances of an RDFS class by providing its IRI as an argument of the `schema` macro.

```elixir{4,12,20}
defmodule User do
  use Grax.Schema

  schema NS.SchemaOrg.Person do
    # ...  
  end
end

defmodule Post do
  use Grax.Schema

  schema NS.SchemaOrg.BlogPosting do
    # ...  
  end
end

defmodule Address do
  use Grax.Schema

  schema NS.SchemaOrg.PostalAddress do
    # ...  
  end
end
```

Such a class declaration has the following effects:

- When mapping a schema struct to RDF graphs, the existence of a class declaration leads to the production of a `rdf:type` statement accordingly. 
- The class declaration also plays a role in regards to link polymorphism, which is discussed below.

By default, the RDF description of a resource doesn't have to include a respective `rdf:type` to be loadable into a `Grax.Schema` struct. 
The behaviour what should happen with resources whose `rdf:type` doesn't match the declared class of the linked schema, however, can be configured with the `:on_rdf_type_mismatch` keyword option on a `link` definition and supports the following values:

- `:force` (default value): use the linked schema anyway
- `:ignore`: ignore these resources
- `:error`: returns an error when such resources are encountered

::: warning

When considering the `:ignore` and `:error` option, you should be aware that Grax has no RDFS reasoning capabilities, which limits their usage to the following scenarios:

- The `rdf:type` of the data of interest always includes all relevant classes, e.g. because the inferable classes are materialized.
- A complete mapping of the class inheritance hierarchy on Grax schemas is available, so we can rely on the schema inheritance awareness discussed in the next section.

:::


## Schema inheritance

It is possible to derive a schema from an existing one. This has two effects: 

- All of the defined properties of the parent schema are inherited to the child schema.
- The child schemas can be used as values of links with the parent schema as their type. This works also during preloading, provided that a corresponding class declaration is defined for the schema.

```elixir
defmodule Customer do
  use Grax.Schema

  alias NS.EX

  schema inherit: User do
    property since: EX.customerSince, type: :date
    
    link subscription: EX.subscribed, type: Subscription
  end
end
```

If a class is also declared the following form is possible:

```elixir
defmodule Customer do
  use Grax.Schema

  alias NS.EX

  schema EX.Customer < User do
    property since: EX.customerSince, type: :date
    
    link subscription: EX.subscribed, type: Subscription
  end
end
```

Multiple inheritance is also supported by providing the inherited schemas in a list.

Note, that the class must not necessarily be a subclass of the class of the inherited schema, although this might be the case often times.

If some of the inherited properties should be redefined with other characteristics, this can be done without any restrictions. They can have a different type or map to a completely different RDF property, although this might be confusing.



## Link polymorphism

By default, all links behave polymorphic, which means not only the Grax schema specified on the `:type` of the link is allowed, but also inherited schemas. During preloading the class declaration is taken into account also, meaning that, after searching for all schemas matching the `rdf:type`s according to the class declarations, the most specific schema inherited from the schema on the `:type` of the link is selected.
If you don't want to deal with schemas of different types as values of a property, you can also disable this behaviour by setting the `:polymorphic` keyword option to `false`.

```elixir
defmodule Customer do
  use Grax.Schema

  alias NS.EX

  schema inherit: User do
    property since: EX.customerSince, type: :date
    
    link subscription: EX.subscribed, type: Subscription, polymorphic: false
  end
end
```

This still means that on preloading, resources from subclasses are recognized as a valid type and don't lead to an error when `:on_rdf_type_mismatch` is set to `:error`, it only means you'll always get the same schema, independent of any actual `rdf:type`s.

::: warning

Note again, that Grax itself has no understanding of RDFS. The aforementioned recognition of inherited RDFS classes is only possible for classes which are associated with a schema and this schema is inherited from the schema specified as the preloaded links `:type`. This unawareness of RDFS is the reason why Grax defaults to `on_rdf_type_mismatch: :force`.

:::


## Union links

Links can also link different types of resources to different schemas. For this, the `:type` of a link property must be given as a map of class URIs to Grax schemas. 

```elixir
defmodule User do
  use Grax.Schema

  alias NS.{SchemaOrg, FOAF}

  schema do
    property name: SchemaOrg.name, type: :string, required: true
    property emails: SchemaOrg.email, type: list_of(:string), required: true
    property age: FOAF.age, type: :integer
    
    link friends: FOAF.friend, type: list_of(User)
    link posts: -SchemaOrg.author, type: list_of(%{
        SchemaOrg.BlogPosting => Post,
        SchemaOrg.Comment => Comment
      })
  end
end

defmodule Comment do
  use Grax.Schema

  alias NS.SchemaOrg

  schema do
    property content: SchemaOrg.text(), type: :string

    link author: SchemaOrg.author(), type: User
  end
end
```

So, depending on the `rdf:type` of the resource linked with a property, the specified schema is used. Other than for normal links, when a linked resource doesn't have any of the specified types, the resource is ignored by default, because `:on_rdf_type_mismatch` defaults to `:ignore` on union links. The reason for this is that union links do not have a unique scheme that could be enforced, so the `:force` option cannot be provided here. However, an equivalent behavior can be defined by providing a fallback in the type-schema mapping where `nil` is used as the key instead of a class URI. The schema associated with `nil` will then be used when none of the other class URI matches an `rdf:type`. When multiple classes of a linked resource are matching, you'll always get an error. You can also enforce an error in case with no matching `rdf:type`, by setting the `:on_rdf_type_mismatch` option to `:error`. 

::: danger

Inheritance awareness on union links is currently limited to the schemas within the schema. That means when schemas are in the union which are in an inheritance relation, the most specific schema according to the `rdf:type` will be selected during preloading. However, no schemas outside the union will be allowed, even when they are inherited from schemas within the union. 

A workaround for cases when you want a polymorphic property which supports multiple schemas is to define a helper schema which is derived from all the schemas you would have used in the union and use this helper schema instead of the union.

:::


## Custom fields

If you already have or want to define certain fields on a `Grax.Schema` struct, which should be ignored by the RDF mapping, you can define them with the `field/1` macro.

```elixir
defmodule User do
  use Grax.Schema

  alias NS.{SchemaOrg, FOAF}

  schema do
    property name: SchemaOrg.name, type: :string, required: true
    property emails: SchemaOrg.email, type: list_of(:string), required: true
    property age: FOAF.age, type: :integer
    
    field :password
  end
end
```

The default value of a custom field can be specified optionally with the `:default` keyword.



## Custom mappings

Sometimes you want to perform more complex or simply non-default transformations when mapping RDF data to and from the Elixir structs of your application. 
Grax offers two ways to provide custom mapping logic for such cases.


### Property mapping functions

One approach is to define your own custom mapping functions for individual properties and register them on the `property` schema definition with the `:from_rdf` and `:to_rdf` options.

A `from_rdf` function must accept three arguments:

1. The first argument is the list of the actual RDF values for the property for which the custom mapping was called. Note, that the function is only called when values for the property are present in the data.
2. The second argument is the `RDF.Description` of the mapped resource, which can be used when the mapping depends on other properties of the resource description.
3. The third argument is whole `RDF.Graph` from which the mapping is called, which can be used when the mapping depends on other statements of the graph.

When a mapping can be performed successfully the mapped value must be returned in an `:ok` tuple. Otherwise an `:error` tuple with the error must be returned.

A `to_rdf` function must accept two arguments:

1. The first argument is the list of the actual values of the property from the struct for which the custom mapping was called.
2. The second argument is the whole `Grax` struct, which can be used when the mapping depends on other properties of it.

The return value can be either:

- a two-element `:ok` tuple with the mapped RDF values
- a three-element `:ok` tuple with the mapped RDF values on second position and a list of additional RDF statements which should be added to the produced graph on the third position (the statements can be given in any form accepted by `RDF.Graph.add/2`)
- an `:error` tuple with an error

For both custom mapping functions you can return `nil` as a value when no values should be produced by the mapping.

```elixir
defmodule User do
  use Grax.Schema

  alias NS.{SchemaOrg, FOAF, EX}

  schema SchemaOrg.Person do
    property name: SchemaOrg.name, type: :string, required: true
    property emails: SchemaOrg.email, type: list_of(:string), required: true
    property age: FOAF.age, type: :integer

    property customer_type: RDF.type, 
             from_rdf: :customer_type_from_rdf,
             to_rdf: :customer_type_to_rdf
    
    field :password

    link friends: FOAF.friend, type: list_of(User)
    link posts: -SchemaOrg.author, type: list_of(Post)
  end

  def customer_type_from_rdf(types, _description, _graph) do
    {:ok, if(RDF.iri(EX.PremiumUser) in types, do: :premium_user)}
  end

  def customer_type_to_rdf(:premium_user, _user), do: {:ok, EX.PremiumUser}
  def customer_type_to_rdf(_, _), do: {:ok, nil}
end
```

Note, that if you provide both `from_rdf` and `to_rdf` functions, you can use any type of value on this property, even ones for which no corresponding datatype is supported. 

Custom fields also support custom `:from_rdf` mappings. So, if you want to define a custom mapping to a field which should not be mapped back to RDF, you can do so with a custom field.

The mapping functions can also be defined in a separate module by providing a tuple of the module and function name on the `:from_rdf` and `:to_rdf` options.

```elixir
defmodule User do
  use Grax.Schema

  alias NS.{SchemaOrg, FOAF, EX}

  schema SchemaOrg.Person do
    property name: SchemaOrg.name, type: :string, required: true
    property emails: SchemaOrg.email, type: list_of(:string), required: true
    property age: FOAF.age, type: :integer
    
    property customer_type: RDF.type, 
             from_rdf: {CustomMappings, :customer_type_from_rdf},
             to_rdf: {CustomMappings, :customer_type_to_rdf}
    
    field :password

    link friends: FOAF.friend, type: list_of(User)
    link posts: -SchemaOrg.author, type: list_of(Post)
  end
end

defmodule CustomMappings do
  def customer_type_from_rdf(types, _description, _graph) do
    {:ok, if(RDF.iri(EX.PremiumUser) in types, do: :premium_user)}
  end

  def customer_type_to_rdf(:premium_user, _user), do: {:ok, EX.PremiumUser}
  def customer_type_to_rdf(_, _), do: {:ok, nil}
end
```


### Callbacks

Another way to define custom mappings is possible with the `on_load/3` and `on_to_rdf/3` callbacks, which can be implemented on your `Grax.Schema` modules.

The `on_load/3` callback is called whenever RDF data is loaded into a respective `Grax.Schema` struct, either directly via the `load/2` function or indirectly through preloading (see the [section on loading graphs](api.html#loading-from-rdf-graphs) for more on this) and allows to change or enrich the mapping.
The function receives three arguments:

1. The `Grax.Schema` struct filled with the default mapping.
2. The `RDF.Graph` or `RDF.Description` which was passed to `load/2` as the data source.
3. The keyword options passed to `load/2`.

The result returned by the `on_load/3` callback implementation will become the result of the initial `load/2` call and should either an `:ok` tuple with `Grax.Schema` struct or an `:error` tuple.

The `on_to_rdf/3` callback is called when the gets mapped to RDF with the `Grax.to_rdf/2` function and receives three arguments also.

1. The `Grax.Schema` struct to be mapped.
2. The `RDF.Graph` with the already mapped data.
3. The keyword options passed to `Grax.to_rdf/2`.

The result must be the updated or enriched `RDF.Graph` in an `:ok` tuple or an error tuple.

```elixir
defmodule User do
  use Grax.Schema

  alias NS.{SchemaOrg, FOAF, EX}

  schema SchemaOrg.Person do
    property name: SchemaOrg.name, type: :string, required: true
    property emails: SchemaOrg.email, type: list_of(:string), required: true
    property age: FOAF.age, type: :integer

    field :customer_type
    field :password

    link friends: FOAF.friend, type: list_of(User)
    link posts: -SchemaOrg.author, type: list_of(Post)
  end

  def on_load(user, graph, _opts) do
    if RDF.iri(EX.PremiumUser) in 
        List.wrap(get_in(graph, [user.__id__, RDF.type()])) do
      {:ok, %User{user | customer_type: :premium_user}}
    else
      {:ok, user}
    end
  end

  def on_to_rdf(%User{customer_type: :premium_user} = user, graph, _opts) do
    {:ok, RDF.Graph.add(graph, [user.__id__, RDF.type(), EX.PremiumUser])}
  end

  def on_to_rdf(user, graph, _opts), do: {:ok, graph}
end
```



