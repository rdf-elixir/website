# API

As we've said, this is an early version, which can map RDF graphs only. 
But even the mapping to RDF graphs is limited. 
You can only map to and from RDF.ex graphs directly, not to graphs in triple stores via SPARQL. Also there are no querying capabilities. So, you'll have to provide the RDF.ex graphs and the identifier by yourself and you'll get back an RDF.ex graph. You can use the serializing capabilities of RDF.ex or the SPARQL client to read and write the RDF.ex graph.

The API for working with the `Grax.Schema` structs and the individuals of these structs is available on the top-level `Grax` module and can be applied polymorphically on `Grax.Schema` structs (with two exceptions). 

In the following we will use the example from the last chapter to show the API in action. Here it is again. The example data:

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

The example `Grax.Schema` structs we've developed in the last chapter:

```elixir
defmodule User do
  use Grax.Schema

  alias NS.{SchemaOrg, FOAF, EX}

  schema SchemaOrg.Person do
    property :name, SchemaOrg.name, type: :string, required: true
    property emails: SchemaOrg.email, type: list_of(:string), required: true
    property :age, FOAF.age, type: :integer
    property :password, nil
    property :customer_type, RDF.type, 
               from_rdf: :customer_type_from_rdf,
               to_rdf: :customer_type_to_rdf
    
    link :friends, FOAF.friend, type: list_of(User)
    link :posts, -SchemaOrg.author, type: list_of(Post)
  end

  def customer_type_from_rdf(types, _description, _graph) do
    {:ok, if(RDF.iri(EX.PremiumUser) in types, do: :premium_user)}
  end

  def customer_type_to_rdf(:premium_user, _user), do: {:ok, EX.PremiumUser}
  def customer_type_to_rdf(_, _), do: {:ok, nil}
end

defmodule Post do
  use Grax.Schema

  alias NS.SchemaOrg

  schema do
    property :title, SchemaOrg.name(), type: :string
    property :content, SchemaOrg.articleBody(), type: :string
    link :author, SchemaOrg.author(), type: User
  end
end
```


## Loading from RDF graphs

You can load a `Grax.Schema` struct from the description in an RDF graph with the `Grax.load/3` function, which expects 

1. the `Grax.Schema` struct module, 
2. the identifier of the resource to be loaded and 
3. a `RDF.Graph` with a description of this resource.

```elixir
iex> Grax.load(User, EX.User1, graph)
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
       author: #Grax.Link.NotLoaded<link :author is not loaded>,
       content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Provident, nihil, dignissimos. Nesciunt aut totam eius. Magnam quaerat modi vel sed, ipsam atque rem, eos vero ducimus beatae harum explicabo labore!",
       title: "Lorem"
     }
   ]
 }}
```

Unlike most of the other functions working on existing `Grax.Schema` structs, you have to provide the `Grax.Schema` module explicitly. For this reason, the `Grax.Schema` modules provide a dedicated `load/2` function. On these the order of the resource identifier and the graph arguments is swapped for better pipeline support. So, the following function call is equivalent to the previous call:

```elixir
graph |> User.load(EX.User1)
```

There are also bang variants of the both the general `Grax.load/3` and the dedicated `load/2` functions on the struct modules available, which return the result directly and fail in error cases as usual. But there's another difference between these `load` variants. The non-bang variant by default performs validations of the data against the schema (described further below), while the non-bang variant does not perform this validation step by default. However, you can control this validation step with the optional `:validate` option flag independently. Except for the different return type, the `load` variants just differ in the default value of this `:validate` option. 

::: tip

Loading values into the structs and performing the validation later is crucial when you want to confront the user with invalid data, eg. in a HTML form for manual cleaning of the data.

:::

The links of a schema will be preloaded as configured in the schema specification. As described in the last chapter, currently only the depth-preloading strategy is implemented. And unless you've configured other preloading depths on the links or the schema, the default preloading depth of one is used, which means you'll get all data and link properties of the loaded resource, but from the linked resources just the data properties. The links of the linked resource won't be loaded.

You can overwrite the preloading options from the schema on a `load`  call with the `:depth` option. 

```elixir
iex> User.load(graph, EX.User1, depth: 2)
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
       author: %User{
         __id__: ~I<http://example.com/User1>,
         age: nil,
         customer_type: :premium_user,
         email: ["jane@example.com", "jane@work.com"],
         friends: [],
         name: "Jane",
         password: nil,
         posts: #Grax.Link.NotLoaded<link :posts is not loaded>
       },
       content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Provident, nihil, dignissimos. Nesciunt aut totam eius. Magnam quaerat modi vel sed, ipsam atque rem, eos vero ducimus beatae harum explicabo labore!",
       title: "Lorem"
     }
   ]
 }}
```


## Explicit preloading

There still can be occasions when a manual preloading is needed:

- when the defaults, either from the schema or the `:depth` keyword on `load/3` weren't sufficient
- when a circle occurred during preloading, aborting the preloading further down
- or you simple discover later on, that you need further data

You can do a manual preload with the `Grax.preload/3` function.

```elixir
iex> user = User.load!(graph, EX.User1)
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
      author: #Grax.Link.NotLoaded<link :author is not loaded>,
      content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Provident, nihil, dignissimos. Nesciunt aut totam eius. Magnam quaerat modi vel sed, ipsam atque rem, eos vero ducimus beatae harum explicabo labore!",
      title: "Lorem"
    }
  ]
}

iex(4)> Grax.preload(user, graph, depth: 2)
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
       author: %Example.User{
         __id__: ~I<http://example.com/User1>,
         age: nil,
         comments: #Grax.Link.NotLoaded<link :comments is not loaded>,
         customer_type: :premium_user,
         email: ["jane@example.com", "jane@work.com"],
         name: "Jane",
         password: nil,
         posts: #Grax.Link.NotLoaded<link :posts is not loaded>
       },
       content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Provident, nihil, dignissimos. Nesciunt aut totam eius. Magnam quaerat modi vel sed, ipsam atque rem, eos vero ducimus beatae harum explicabo labore!",
       title: "Lorem"
     }
   ]
 }}
```

Note, that this function essentially overwrites everything accept the data properties on the root node. 


## Creation from scratch

When an RDF description of a resource does not exist yet, but should be created in the application, the `build` functions can be used. Similar to the `load` functions there is also a bang-variant and as it requires the `Grax.Schema` module as the first argument too, there are are also dedicated functions of both `build` functions without this argument on the `Grax.Schema` modules available. The other required argument then remains the resource identifier.

```elixir
iex> User.build!(EX.User2)
%User{
  __id__: ~I<http://example.com/ex>,
  age: nil,
  customer_type: nil,
  email: [],
  friends: [],
  name: nil,
  password: nil,
  posts: []
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
  friends: #Grax.Link.NotLoaded<link :friends is not loaded>,
  name: "John",
  password: "secret",
  posts: #Grax.Link.NotLoaded<link :posts is not loaded>
}
```

Again, the non-bang variant performs validations, while the bang variant doesn't.


## Schema-conformant updates

You can set specific property values of `Grax.Schema` structs with the `Grax.put/3` function.

```elixir
iex> Grax.put(user, :age, 42)
{:ok,
 %User{
   __id__: ~I<http://example.com/User2>,
   age: 42,
   customer_type: nil,
   email: ["john@example.com"],
   friends: [],
   name: "John",
   password: "secret",
   posts: []
 }}
```

All preexisting values of a property will be overwritten. 

If the value doesn't match the type of the property specified in the schema an `:error` with a detailed error struct is returned.

```elixir
iex> Grax.put(user, :age, "old")
{:error,
 %Grax.Schema.TypeError{
   message: "value \"old\" does not match type RDF.XSD.Integer",
   type: RDF.XSD.Integer,
   value: "old"
 }}
```

The non-bang variant doesn't perform validations. But even without that, you should always prefer the `Grax.put!/3` function over Elixir's `Map.put/3` function or other methods for updating structs, since it will behave schema-aware. For example, if you put a single value on a property with multiple possible values it will be put into a list:

```elixir
iex> Grax.put!(user, :email, "john@doe.com")
%User{
  __id__: ~I<http://example.com/User2>,
  age: 42,
  customer_type: nil,
  email: ["john@doe.com"],
  friends: [],
  name: "John",
  password: "secret",
  posts: []
}
```

Nested structs can be set by providing a `Grax.Schema` struct accordingly.

```elixir
iex> Grax.put!(user, :posts, Post.build!(EX.Post2, title: "Foo"))
%User{
  __id__: ~I<http://example.com/User2>,
  age: 42,
  customer_type: nil,
  email: ["john@example.com"],
  friends: [],
  name: "John",
  password: "secret",
  posts: [
    %Post{
      __id__: ~I<http://example.com/Post2>,
      author: nil,
      content: nil,
      title: "Foo"
    }
  ]
}
```


The `Grax.put/2` and `Grax.put!/2`  functions also allow to set multiple values at once with a map or keyword list.

```elixir
iex> Grax.build!(user, 
...>   email: ["john@doe.com" | user.email],
...>   age: user.age + 1)
%User{
  __id__: ~I<http://example.com/User2>,
  age: 43,
  customer_type: nil,
  email: ["john@doe.com", "john@example.com"],
  friends: [],
  name: "John",
  password: "secret",
  posts: []
}
```



## Validation against the schema

A `Grax.Schema` struct can be validated with the `Grax.validate/1` function which either returns the given `Grax.Schema` struct unchanged in an `:ok` tuple. Otherwise an `:error` tuple with a `Grax.ValidationError` containing a collection of all failed validations.

```elixir
iex> User.build!(EX.User2, 
...>   name: ["John", "JD"],
...>   age: "old")
...> |> Grax.validate()
{:error,
 %Grax.ValidationError{
   errors: [
     name: %Grax.Schema.TypeError{
       message: "value [\"John\", \"JD\"] does not match type RDF.XSD.String",
       type: RDF.XSD.String,
       value: ["John", "JD"]
     },
     email: %Grax.Schema.RequiredPropertyMissing{
       message: "no value for required property :email present",
       property: :email
     },
     age: %Grax.Schema.TypeError{
       message: "value \"old\" does not match type RDF.XSD.Integer",
       type: RDF.XSD.Integer,
       value: "old"
     }
   ]
 }}
```


## Mapping to RDF graphs

With the `Grax.to_rdf/1` function finally, you can map a `Grax.Schema` struct to a `RDF.Graph`.

```elixir
iex> Grax.to_rdf(user)
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


