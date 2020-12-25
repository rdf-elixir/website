# Working with mappings

The API for working with the `RDF.Mapping` structs is available on the top-level `RDF.Mapping` module and can be applied polymorphically on `RDF.Mapping` structs (with two exceptions) . In the following we will use the example from the last chapter to show the API in action. Here it is again:

The example data:

```elixir
graph =
  """
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
      schema:articleBody "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Provident, nihil, dignissimos. Nesciunt aut totam eius. Magnam quaerat modi vel sed, ipsam atque rem, eos vero ducimus beatae harum explicabo labore!" .
  """
  |> RDF.Turtle.read_string!()
```

The `RDF.Mapping` struct we developed in the last chapter:

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


## Loading from RDF graphs

You can load a `RDF.Mapping` struct from the description in a graph with the `RDF.Mapping.load/3` function, which expects the `RDF.Mapping` struct module, the identifier of the resource to be loaded and a graph with a description of this resource.

```elixir
iex> RDF.Mapping.load(User, EX.User1, graph)
{:ok,
 %User{
   __id__: ~I<http://example.com/User1>,
   age: nil,
   customer_type: :premium_user,
   email: ["jane@example.com", "jane@work.com"],
   friends: [],
   name: "Jane",
   password: nil,
   posts: [
     %Post{
       __id__: ~I<http://example.com/Post1>,
       author: #RDF.Mapping.Link.NotLoaded<link :author is not loaded>,
       content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Provident, nihil, dignissimos. Nesciunt aut totam eius. Magnam quaerat modi vel sed, ipsam atque rem, eos vero ducimus beatae harum explicabo labore!",
       title: "Lorem"
     }
   ]
 }}
```

Unlike most of the other functions working on filled `RDF.Mapping` structs, you have to provide the `RDF.Mapping` module explicitly. For this reason, the `RDF.Mapping` modules provide a dedicated `load/2` function. On these the order of the resource identifier and the graph arguments is swapped for better pipeline support. So, the following function call is equivalent to the previous call:

```elixir
graph |> User.load(EX.User1)
```

There are also bang variants of the both the general `RDF.Mapping.load/3` and the dedicated `load/2` functions on the struct modules available, which return the result directly and fail in error cases as usual. But there's another difference between these `load` variants. The non-bang variant by default performs validations of the data against the schema (described further below), while the non-bang variant does not perform this validation step by default. However, you can control this validation step with the optional `:validate` option flag independently. The `load` variants just differ in the default value of this `:validate` option. 

::: tip

Loading values into the structs and performing the validation later is very useful when you want to present invalid data in a form for fixes by the user.

:::

Another supported option on all `load` functions is the `:preload` option ... TODO

## Creation from scratch

When a RDF description of a resource does not exist yet, but should be created in the application, the `build` functions can be used. Similar to the `load` functions there is also a bang-variant and as it requires the `RDF.Mapping` module as the first argument too, there are are also dedicated functions of both `build` functions without this argument on the `RDF.Mapping` modules themself available. The other required argument then remains the resource identifier.

```elixir
iex> User.build!(EX.User2)
%User{
  __id__: ~I<http://example.com/User2>,
  age: nil,
  customer_type: nil,
  email: [],
  friends: #RDF.Mapping.Link.NotLoaded<link :friends is not loaded>,
  name: nil,
  password: nil,
  posts: #RDF.Mapping.Link.NotLoaded<link :posts is not loaded>
}
```

You can also pass initial values as a map or keyword list to each of the build functions:

```elixir
iex> user = User.build!(EX.User2, 
...>   name: "John", 
...>   email: "john@example.com", 
...>   password: "secret")
 %User{
  __id__: ~I<http://example.com/User2>,
  age: nil,
  customer_type: nil,
  email: ["john@example.com"],
  friends: #RDF.Mapping.Link.NotLoaded<link :friends is not loaded>,
  name: "John",
  password: "secret",
  posts: #RDF.Mapping.Link.NotLoaded<link :posts is not loaded>
}
```

Again, the non-bang variant performs validations, while the bang variant doesn't.

## Schema-conformant updates

You can set specific property values of `RDF.Mapping` structs with the `RDF.Mapping.put/3` function.

```elixir
iex> RDF.Mapping.put(user, :age, 42)
{:ok,
 %User{
   __id__: ~I<http://example.com/User2>,
   age: 42,
   customer_type: nil,
   email: ["john@example.com"],
   friends: #RDF.Mapping.Link.NotLoaded<link :friends is not loaded>,
   name: "John",
   password: "secret",
   posts: #RDF.Mapping.Link.NotLoaded<link :posts is not loaded>
 }}
```

All preexisting values of a property will be overwritten. 

If the value doesn't match the type of the property specified in the schema an `:error` with a detailed error struct is returned.

```elixir
iex> RDF.Mapping.put(user, :age, "old")
{:error,
 %RDF.Mapping.Schema.TypeError{
   message: "value \"old\" does not match type RDF.XSD.Integer",
   type: RDF.XSD.Integer,
   value: "old"
 }}
```

The non-bang variant doesn't perform validations. But even without that, you should always prefer the `RDF.Mapping.put!/3` function over Elixir's `Map.put/3` function or other methods for updating structs, since it will behave schema-aware. For example, if you put a single value on a property with multiple possible values it will be put into a list:

```elixir
iex> RDF.Mapping.put!(user, :email, "john@doe.com")
%User{
  __id__: ~I<http://example.com/User2>,
  age: 42,
  customer_type: nil,
  email: ["john@doe.com"],
  friends: #RDF.Mapping.Link.NotLoaded<link :friends is not loaded>,
  name: "John",
  password: "secret",
  posts: #RDF.Mapping.Link.NotLoaded<link :posts is not loaded>
}
```

Nested structs can be set by providing a `RDF.Mapping` struct accordingly.

```elixir
iex> RDF.Mapping.put!(user, :posts, Post.build!(EX.Post2, title: "Foo"))
%User{
  __id__: ~I<http://example.com/User2>,
  age: 42,
  customer_type: nil,
  email: ["john@example.com"],
  friends: #RDF.Mapping.Link.NotLoaded<link :friends is not loaded>,
  name: "John",
  password: "secret",
  posts: [
    %Post{
      __id__: ~I<http://example.com/Post2>,
      author: #RDF.Mapping.Link.NotLoaded<link :author is not loaded>,
      content: nil,
      title: "Foo"
    }
  ]
}
```


The `RDF.Mapping.put/2` and `RDF.Mapping.put!/2`  functions also allow to set multiple values at once with a map or keyword list.

```elixir
iex> RDF.Mapping.build!(user, 
...>   email: ["john@doe.com" | user.email],
...>   age: user.age + 1)
%User{
  __id__: ~I<http://example.com/User2>,
  age: 43,
  customer_type: nil,
  email: ["john@doe.com", "john@example.com"],
  friends: #RDF.Mapping.Link.NotLoaded<link :friends is not loaded>,
  name: "John",
  password: "secret",
  posts: #RDF.Mapping.Link.NotLoaded<link :posts is not loaded>
}
```



## Validation against the schema

A `RDF.Mapping` struct can be validated with the `RDF.Mapping.validate/1` function which either returns the given `RDF.Mapping` struct unchanged in an `:ok` tuple. Otherwise an `:error` tuple with a `RDF.Mapping.ValidationError` containing a collection of all failed validations.

```elixir
iex> User.build!(EX.User2, 
...>   name: ["John", "JD"],
...>   age: "old")
...> |> RDF.Mapping.validate()
{:error,
 %RDF.Mapping.ValidationError{
   errors: [
     name: %RDF.Mapping.Schema.TypeError{
       message: "value [\"John\", \"JD\"] does not match type RDF.XSD.String",
       type: RDF.XSD.String,
       value: ["John", "JD"]
     },
     email: %RDF.Mapping.Schema.RequiredPropertyMissing{
       message: "no value for required property :email present",
       property: :email
     },
     age: %RDF.Mapping.Schema.TypeError{
       message: "value \"old\" does not match type RDF.XSD.Integer",
       type: RDF.XSD.Integer,
       value: "old"
     }
   ]
 }}
```


## Mapping to RDF graphs

With the `RDF.Mapping.to_rdf/1` function finally, you can map a `RDF.Mapping` struct to a `RDF.Graph`.

```elixir
iex> RDF.Mapping.to_rdf(user)
{:ok,
 #RDF.Graph name: nil
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

<http://example.com/Post2>
    <https://schema.org/author> <http://example.com/User2> ;
    <https://schema.org/name> "Foo" .

<http://example.com/User2>
    a <https://schema.org/Person> ; 
    <https://schema.org/email> "john@doe.com", "john@example.com" ;
    <https://schema.org/name> "John" ;
    <http://xmlns.com/foaf/0.1/age> 43 .
}
```


