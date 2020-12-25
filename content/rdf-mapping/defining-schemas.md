# Defining mapping schemas

An RDF mapping is a 

As an example, let's assume we have a RDF data like this which we want to map to Elixir structs for an application:

```ttl
@prefix : <http://example.com/> .
@prefix schema: <https://schema.org/> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .

:User1 
    a schema:Person, :PremiumUser ;
    schema:name "Jane" ;
    schema:email "jane@example.com", "jane@work.com" ;
    foaf:age 30 .

:Post1
    schema:author :User1 ;
    schema:name "Lorem" ;
    schema:articleBody """Lorem ipsum dolor sit amet, consectetur adipisicing elit. Provident, nihil, dignissimos. Nesciunt aut totam eius. Magnam quaerat modi vel sed, ipsam atque rem, eos vero ducimus beatae harum explicabo labore!""" .
```


## Basic schema definitions

A RDF.Mapping schema consists of a number property declarations inside of a `schema` block. We'll have to deal with two kinds if properties: data properties whose object values we want to map to simple Elixir values and object properties, which are called links in this project, with IRI or blank node values which should be mapped recursively to nested RDF.Mapping structs.

Let's look at data properties first. They are declared with the `property/3` macro which has least two arguments: 

1. an atom name for the property which will be the name used in the struct defined for the mapping module
2. an IRI for the property which is used in the RDF representation and can be given in any form the `RDF.IRI.new/1` constructor of RDF.ex can create IRIs from, including IRIs directly (eg. via IRI sigils), strings or terms from a RDF.ex vocabulary namespace.

```elixir
defmodule User do
  use RDF.Mapping

  alias NS.SchemaOrg

  schema do
    property :name, SchemaOrg.name
  end
end
```

This will define a struct on the `User` which consists of the `name` attribute and an internal `__id__` field which will hold the `RDF.IRI` or `RDF.BlankNode` identifier of the mapped RDF resource.

::: tip

The `schema` macro can be considered equal to a `defstruct` in that it allows to define every struct which can be defined with it. Under the hood it will produce the `defstruct` call as the first line of the generated code, which means you can use all types of annotations before the `schema` macro that can be used before a `defstruct`, eg. `@derive` annotations etc.

:::

Additional attributes which should be on the struct but have no correspondence in the mapped RDF data can be defined by setting `nil` as the value for the mapped IRI on the second argument position. We'll call these virtual properties.

```elixir
defmodule User do
  use RDF.Mapping

  alias NS.SchemaOrg

  schema do
    property :name, SchemaOrg.name
    property :password, nil
  end
end
```


The third argument of the `property/3` macro allows various other specifications of the property via keyword options, which we'll discuss one by one in the next sections.


## Datatypes

The `type` option allows specify the datatype that a data property should contain and which datatype the produced literals for the property should have. The types are given as atoms which correspond to the respective RDF.ex literal datatypes:

|   RDF.Mapping datatype  |   RDF.ex literal datatype    |
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

Above these datatype there are a couple of special datatypes:

- The `:any` datatype (which is the default when no datatype is specified  with the `:type` option) means the property can contain values of any datatype. The datatype mapping from Elixir values to XSD datatypes described in the table in the "Typed Literal" section [here](/rdf-ex/literals.html#typed-literals) is applied in this case.
- The `:numeric` datatype behaves similar to the `:any` datatype, but limits the values to those of numeric datatypes.
- The `:iri` datatype can be used if IRIs should be kept as they are, which is useful when they shouldn't be mapped to nested mapping structs (described below).

Unless specified otherwise it is assumed that the value of every property is unique. If multiple values should be allow the specified datatype on the `:type` option must be put in square brackets. The values will then be kept in a list. If you want to specify that a property can have multiple values of any datatype you can do so with `[:any]` or `[]`.

On virtual properties `:type` definition have no effect.

With that we can extend our example mapping schema like this:

```elixir
defmodule User do
  use RDF.Mapping

  alias NS.{SchemaOrg, FOAF}

  schema do
    property :name, SchemaOrg.name, type: :string
    property :email, SchemaOrg.email, type: [:string]
    property :age, FOAF.age, type: :integer
    property :password, nil
  end
end
```


## Default values

Default values for the data properties can be defined with the `:default` option. If not specified otherwise this will be `nil` for single value properties or the empty list for properties with multiple values. If a `:type` is defined, the `:default` value must of this datatype.

You can also define default values on virtual properties.


## Required properties

If you want to specify that a value for a property must be present, you can do so with the `:required` option, which defaults to `false`.

```elixir
defmodule User do
  use RDF.Mapping

  alias NS.{SchemaOrg, FOAF}

  schema do
    property :name, SchemaOrg.name, type: :string, required: true
    property :email, SchemaOrg.email, type: [:string], required: true
    property :age, FOAF.age, type: :integer
    property :password, nil
  end
end
```


## Links

As we saw above IRIs as property values can be kept in data properties with the `:iri` datatype. But usually you'll want to map them recursively to nested mapping structs of the descriptions of the respective resource. This can be achieved with the `link/3` macro. The first two arguments are just as for data properties for the name and IRI of the property. The `:type` option however has a different meaning and is no longer optional on link properties. It must be the module of another `RDF.Mapping` struct. But just as for data properties single struct values are assumed unless the module name is put in square brackets.

```elixir
defmodule User do
  use RDF.Mapping

  alias NS.{SchemaOrg, FOAF}

  schema do
    property :name, SchemaOrg.name, type: :string, required: true
    property :email, SchemaOrg.email, type: [:string], required: true
    property :age, FOAF.age, type: :integer
    property :password, nil
    
    link :friends, FOAF.friend, type: [User]
  end
end
```

Sometimes we want to define a link on a `RDF.Mapping` struct for which no property exists directly. For example, in our data there is no property linking a user to a post directly. Instead there is the `schema:author`property which links a post to its authors, so exactly the inverse property of what we want. You can specify a link property on a `RDF.Mapping` schema in those cases by declaring it as an inverse property with a minus sign before the IRI of the inverse property.

```elixir
defmodule User do
  use RDF.Mapping

  alias NS.{SchemaOrg, FOAF}

  schema do
    property :name, SchemaOrg.name, type: :string, required: true
    property :email, SchemaOrg.email, type: [:string], required: true
    property :age, FOAF.age, type: :integer
    property :password, nil
    
    link :friends, FOAF.friend, type: [User]
    link :posts, -SchemaOrg.author, type: [Post]
  end
end

defmodule Post do
  use RDF.Mapping

  alias NS.SchemaOrg

  schema do
    property :title, SchemaOrg.name(), type: :string
    property :content, SchemaOrg.articleBody(), type: :string
    link :author, SchemaOrg.author(), type: Example.User
  end
end
```



## Class declarations

You can optionally specify that the instances of a `RDF.Mapping` struct should be instances of RDFS class by providing its IRI as an argument of the `schema` macro.

```elixir
defmodule User do
  use RDF.Mapping

  alias NS.{SchemaOrg, FOAF}

  schema SchemaOrg.Person do
    # ...  
  end
end
```

For now, the only effect that a class-declaration has is that the mapping to RDF will produce a `rdf:type` statement accordingly. In particular it doesn't mean that the RDF description of resource must include a respective `rdf:type` to be loadable into a `RDF.Mapping` struct.


## Custom mappings

Sometimes you want to perform more complex or simply non-default transformations when mapping RDF data to and from the Elixir structs of your application. In these cases you can define your own custom mapping functions on the `RDF.Mapping` module and declare their usage on the `property` with the `:from_rdf` and `:to_rdf` options and the respective function names.

The `from_rdf` function must accept three arguments:

1. The first argument is the list of the actual RDF values for the property for which the custom mapping was called.
2. The second argument is the `RDF.Description` of the mapped resource, which can be used when the mapping depends on other properties of the resource description.
3. The third argument is whole `RDF.Graph` from which the mapping is called, which can be used when the mapping depends on other statements of the graph.

When a mapping can be performed successfully the mapped value must be returned in an `:ok` tuple. Otherwise an `:error` tuple with the error must be returned.

The `to_rdf` function must accept two arguments:

1. The first argument is the list of the actual values of the property from the struct for which the custom mapping was called.
2. The second argument is the whole `RDF.Mapping` struct, which can be used when the mapping depends on other properties of it.

The return value can be either:

- a two-element `:ok` tuple with the mapped RDF values
- a three-element `:ok` tuple with the mapped RDF values on second position and a list of additional RDF statements which should be added to the produced graph on the third position (the statements can be given in any form accepted by `RDF.Graph.add/2`)
- an `:error` tuple with an error

For both custom mapping function you can return `nil` as a value when no values should be produced by the mapping.


```elixir
defmodule User do
  use RDF.Mapping

  alias NS.{SchemaOrg, FOAF, EX}

  schema SchemaOrg.Person do
    property :name, SchemaOrg.name, type: :string, required: true
    property :email, SchemaOrg.email, type: [:string], required: true
    property :age, FOAF.age, type: :integer
    property :password, nil
    property :customer_type, RDF.type, 
               from_rdf: :customer_type_from_rdf,
               to_rdf: :customer_type_to_rdf
    
    link :friends, FOAF.friend, type: [User]
    link :posts, -SchemaOrg.author, type: [Post]
  end

  def customer_type_from_rdf(types, _description, _graph) do
    {:ok, if(RDF.iri(EX.PremiumUser) in types, do: :premium_user)}
  end

  def customer_type_to_rdf(:premium_user, _user), do: {:ok, EX.PremiumUser}
  def customer_type_to_rdf(_, _), do: {:ok, nil}
end
```

Note, that if you provide both `from_rdf` and `to_rdf` functions, you can use any type of value on this property, even ones for which no corresponding datatype is supported. But if the value(s) produced by `from_rdf` and kept in the struct is covered by a supported a datatype it can still be useful to specify a `type` to benefit from the performed validations described in the next chapter.


