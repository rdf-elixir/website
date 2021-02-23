# Schemas

A **_Grax schema_** is just an Elixir struct.  In a traditional application, backed by a relational data model, you want to work with Elixir structs with the values from the relational database. You'll probably do this traditionally in Elixir with Ecto, by defining some `Ecto.Schema`s for the domain entities of your business. `Grax.Schema`s are similar to `Ecto.Schema`s, they both map the data to Elixir structs with some semantics on top of them, like a type system etc.

But while Ecto maps data from relational databases, Grax maps data from graph databases to Elixir structs. Graph databases are based on the graph data model, which has less technical friction between the conceptual model of the humans and the data model for the machine as it is perfectly [demonstrated here](https://youtu.be/cHXbYLNa0qQ?t=290). By reducing the barrier between your conceptual models and the data models for your application, you have less to think about technical details and can spend more time on thinking about the actual domain model of the business problems your application has to solve.
You've might have already got a feel of this, when working with GraphQL, you simply define the nested schemas of a tree.

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

This will define a struct on the `User` module. Although this struct doesn't have any user-defined fields for the domain model of our application yet, this could already represent an RDF graph node, since every `Grax.Schema` struct has at least an internal `__id__`  field, which contains the `RDF.IRI` or `RDF.BlankNode`, mapping to a graph node. So, an instance of this struct would look like this:

```elixir
alias NS.EX

%User{__id__: RDF.iri(EX.User1)}
%Address{__id__: ~B<Address1>}
```


These structs from RDF.ex are the only RDF-related values you'll see in a Grax schema struct and will be replaced with a more generic solution in the next version. The additional `__id__` field should be treated similarly as the internal `__struct__` field of Elixir structs: use it maybe for pattern matching, but don't touch it directly (other than via functions exposed by the API). 

::: tip

The `schema` macro can be considered equal to a `defstruct` in that it allows to define every struct which can be defined with it. Under the hood it will produce the `defstruct` call as the first line of the generated code, which means you can use all types of annotations before the `schema` macro that can be used before a `defstruct`, eg. `@derive` annotations etc.

:::

But without any fields this isn't very interesting.


### Properties

As opposed to the term "field" used for the elements of Elixir structs and `Ecto.Schema`s, we are calling the elements of the `Grax.Schema` struct **_properties_**, because we're mapping them to RDF properties. Unlike for fields of an Ecto schema, we'll not just have to provide a name atom for our property fields, but also a URI for the RDF property.

So, a property definition on a Grax schema is done in the body of a `schema/1` block with the `property/3` macro and the property field name and RDF property URI as the first two arguments.

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

We'll constantly use terms from RDF.ex vocabulary namespaces. This are modules and functions on these modules, which can be used instead of URIs in the Elixir code. If you're new to RDF.ex, you can read more about this [here](/rdf-ex/vocabularies).
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

The property is accessible as a usual field name of the struct, but has an exact RDF interpretation implicitly through the internal mapping to an RDF property identifier. These minimal forms without any further property specifications are already valid property definitions in Grax. Unlike an Ecto schema, which requires a type specification, these structs are already fully functional. In a Grax schema the types are optional, just as RDF and most other graph models are at its core schema-free data models with optional types later on. 

But before we bring types into the game, we'll have to differentiate two general kinds of properties: 

1. **_Data properties_**, whose values we want to map to simple Elixir values, like strings and integers etc.
2. **_Link properties_** (the _object properties_ of OWL), whose IRI or blank node values should be mapped to recursively nested `Grax.Schema` structs.

Despite having very different kinds of values, there's one type dichotomy across both kinds of properties. We can have single values or sets of values.

By default it is assumed that the value of every property is unique, unless specified otherwise. If multiple values are allowed, a list type can be specified with the `list_of` type constructor function which expects the type of its elements. The values will then be kept in a list accordingly. If you want to specify that a property can have multiple values of any datatype you can use the `list` function.

With that we can extend our example mapping schema like this:

```elixir
defmodule User do
  use Grax.Schema

  alias NS.{SchemaOrg, FOAF}

  schema do
    property name: SchemaOrg.name, type: :string
    property emails: SchemaOrg.email, type: list_of(:string)
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

The optional type specifications on our two kinds are fundamentally different. The types of data properties defined with the `property` macros can be specified by providing the name of a datatype with the `:type` keyword.

```elixir
defmodule User do
  use Grax.Schema

  alias NS.{SchemaOrg, FOAF}

  schema do
    property name: SchemaOrg.name, type: :string
    property emails: SchemaOrg.email, type: list_of(:string)
    property age: FOAF.age, type: :integer
  end
end
```

The specified datatype defines what value a data property can have and which RDF datatype the produced literals for the RDF property should have. 
The functions for working with these structs will validate the types of the values in the property fields in accordance with the datatype provided with the `:type` specification as described in the [Grax API section](/grax/api).

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


### Required properties

If you want to specify that a value for a data property must be present, you can do so with the `:required` option, which defaults to `false`.

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




## Link properties

Now, back to our two kinds of properties, we'll see how link properties are mapped on to our Grax schemas. 

Link properties, in the following sometimes called more shortly links, are on the edges of an RDF graph between the inner nodes with URIs or blank nodes, as opposed to data properties which are on the edges to leaf nodes with RDF literals. Other than for data properties, the actual a node identifier like an URI or a blank node of a link property, is not of interest, but it's the description of the thing the identifier refers to. So, the values of link properties are not the URIs or blank nodes in the object position of an RDF statement, but another Grax schema with the properties from the RDF description of the linked resource.

Just like relational associations are in Ecto mapped to the struct fields through another Ecto schema for the associated table, the linked resources of a root resource are embedded into the struct in the respective field, where the properties of the linked resource are kept, potentially linking to other resources. So, the links allow us to traverse the nodes of a graph, as a tree structure down from a root resource and its fields of nested `Grax.Schema` structs.

A Grax link can be defined in a Grax `schema` definition with another macro specifically for link properties: the `link/3` macro. 
It has almost the same interface as the `property/3` macro. The first two arguments are again for the name and IRI of the property. 
The `:type` option however has a different meaning and is no longer optional. It must be the module name of another `Grax.Schema` struct.

```elixir{11}
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
    property country: SchemaOrg.addressCountry, type: :string
    property city: SchemaOrg.addressLocality, type: :string
    property street: SchemaOrg.streetAddress, type: :string
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

While you have to deal in Ecto with the relational data model with different types of associations and mappings in the relational data model (1-to-1, 1-to-n, n-to-m, with an implicit or explicit join-schema etc.), the graph data model just has edges with different kinds of cardinalities, which are in Grax mapped to either single values or a list of multiple values, just like data properties, only that it's now just single or multiple schema structs for the linked nodes.
Just as for data properties single linked schema structs are assumed unless it is list type is set on the  `:type` keyword with the `list_of` function and the module name of the schema. 

```elixir
defmodule User do
  use Grax.Schema

  alias NS.{SchemaOrg, FOAF}

  schema do
    property name: SchemaOrg.name, type: :string, required: true
    property emails: SchemaOrg.email, type: list_of(:string), required: true
    property age: FOAF.age, type: :integer
    
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


The default value for `:depth` is `1`. This means all of the data and object properties are loaded, including the nested `Grax.Schema` mapping with the descriptions of a linked resource, BUT NOT the linked `Grax.Schema` structs of these nested `Grax.Schema` structs. These would only be preloaded if the depth was one more and so on. So, without a further specification of the preloading depth with the `:depth` keyword, our `User` struct would look like this.

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
    country: #Grax.Link.NotLoaded<link :country is not loaded>
  }
}
```

The default value of all link property fields on the struct is a `Grax.Link.NotLoaded` exception struct.
If you've got a `Grax.Schema` struct with a value like this on the link field and want to access it, you'll have to do an explicit call of the `Grax.preload/3` function described in the next chapter about the API.

But to ensure a proper processing of the Grax schema structs, which might expect certain fields in deeper layers of the struct, you don't want to have to deal with exceptions and do a manual preload, when you can expect them generally. In cases like this, you can enforce the depth of the preloading with the `:depth` keyword. This can be achieved in multiple ways.
 
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

If all link properties of schema should have the same preloading depth, the `:depth` keyword can also be specified on the `use Graph.Schema` call.

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
Although simple, it should be usable in some cases, especially with the capability to override preloading settings on individual API calls at any time.
But again, this was just the easy, lowest hanging fruit of a strategy for a preloading algorithm. What we definitely want is for example query pattern-based or path-based preloading or that data properties can be defined that fetch values from the neighbourhood of a node directly into a schema, which will hopefully be available in future versions.


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

For now, the only effect of a class declaration is that the mapping to RDF graphs will produce a `rdf:type` statement accordingly. In particular it doesn't mean that the RDF description of a resource must include a respective `rdf:type` to be loadable into a `Grax.Schema` struct.


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

Sometimes you want to perform more complex or simply non-default transformations when mapping RDF data to and from the Elixir structs of your application. In these cases you can define your own custom mapping functions on the `Grax.Schema` module and declare their usage on the `property` schema definition with the `:from_rdf` and `:to_rdf` options and the respective function names.

The `from_rdf` function must accept three arguments:

1. The first argument is the list of the actual RDF values for the property for which the custom mapping was called.
2. The second argument is the `RDF.Description` of the mapped resource, which can be used when the mapping depends on other properties of the resource description.
3. The third argument is whole `RDF.Graph` from which the mapping is called, which can be used when the mapping depends on other statements of the graph.

When a mapping can be performed successfully the mapped value must be returned in an `:ok` tuple. Otherwise an `:error` tuple with the error must be returned.

The `to_rdf` function must accept two arguments:

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
    property password: nil
    property customer_type: RDF.type, 
             from_rdf: :customer_type_from_rdf,
             to_rdf: :customer_type_to_rdf
    
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
    property password: nil
    property customer_type: RDF.type, 
             from_rdf: {CustomMappings, :customer_type_from_rdf},
             to_rdf: {CustomMappings, :customer_type_to_rdf}
    
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
