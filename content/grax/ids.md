# Ids

In the last chapter about the API we saw that we'll have to provide a URI (or blank node) identifier when building a new resource with `Grax.build/2`. Minting an identifier for a new resource is a non-trivial step as these identifiers must be unique and (in most cases) persistent, i.e. should not change over the course of the lifetime of the resource. So, it would be good if the identifier creation logic wouldn't be scattered around the code base wherever we are building new resources. For this purpose, we can define the identifier creation logic in one central place with Grax id specs.
A Grax id spec is a module which uses `Grax.Id.Spec` macros to the define the overall identifier namespace structure and the specific rules for the creation of identifiers for the Grax schemas of our application. 
This chapter explains the definition and use of those Grax id specs and enable you to implement common [identifier patterns](https://patterns.dataincubator.org/book/identifier-patterns.html).


## Namespaces

A Grax id spec module first has to `use Grax.Id.Spec` to make the necessary macros available. With that, you can start to lay out the structure of the namespace the identifiers with the `namespace/1` macro. It takes a string with a fragment of a URI and a `do` block which consists of nested `namespace` calls or definitions of id schemas, which we'll discuss later. The outermost `namespace` call must be an absolute URI and can be given also a namespace vocabulary term instead of a string, while the nested namespaces just define a fragment string which will be concatenated to parent namespace. 

```elixir
defmodule Example.IdSpec do
  use Grax.Id.Spec

  namespace "http://example.com/" do
    namespace "foo/" do
    end

    namespace "bar#" do
    end
  end
end
```

This example defines three namespaces in which we can put our id schemas:

1. `http://example.com/`
2. `http://example.com/foo/`
3. `http://example.com/bar#`

You can also define an optional prefix for a namespace with the `prefix` keyword argument on a `namespace` call. 

```elixir
defmodule Example.IdSpec do
  use Grax.Id.Spec

  namespace "http://example.com/" do
    namespace "foo/", prefix: :foo do
    end

    namespace "bar#", prefix: :bar do
    end
  end
end
```

The Grax id spec module provides a `prefix_map/0` function which returns a `RDF.PrefixMap` you can pass to the RDF serialization functions (see [this section in the RDF.ex guide](/rdf-ex/serializations.html#managing-prefixes) for more on this). 

```elixir
iex> Example.IdSpec.prefix_map()
%RDF.PrefixMap{
  bar: ~I<http://example.com/bar#>,
  foo: ~I<http://example.com/foo/>
}
```

Unless you provide other prefixes on `Grax.to_rdf/1` it will use this prefix map automatically to add them to the created graph, so that they in turn will be used on serialization.

The URI of one single namespace can be defined as the base URI by using the `base` macro instead of the `namespace`.

```elixir
defmodule Example.IdSpec do
  use Grax.Id.Spec

  namespace "http://example.com/" do
    base "foo/", prefix: :foo do
    end

    namespace "bar#", prefix: :bar do
    end
  end
end
```

The `base_iri/0` function of the Grax id spec module will return the `RDF.IRI` of this namespace.

```elixir
iex> Example.IdSpec.base_iri()
~I<http://example.com/foo/>
```

As we will see later, namespaces can also act as containers for shared arguments of its id schemas, but let's introduce id schemas properly first.


## Id schemas

An id schema for a Grax schema can be defined in the most generic way with the `id_schema/2` macro inside a `namespace` block. It expects an URI template according to [RFC 6570](https://en.wikipedia.org/wiki/URI_Template) as the first argument and something to specify on which Grax schemas this id schema should be applied, most of the time by specifying the schema (or multiple schemas as a list) directly with the `schema` keyword argument. You can use the properties of the Grax schema as parameters in the URI template.

Let's say we have a `Book` Grax schema defined with an `:isbn` property we'd like to use as the basis for its ids. We can define an id schema for the `Book` schema like this:

```elixir
defmodule Example.IdSpec do
  use Grax.Id.Spec

  namespace "http://example.com/" do
    id_schema "books/{isbn}", schema: Book
  end
end
```

As we've said, most of the time the Grax schema on which id schema should be applied is given directly. For this form the `id` macro provides a more succinct but semantically equivalent form. So, the following is an equivalent definition of the same id schema:

```elixir
defmodule Example.IdSpec do
  use Grax.Id.Spec

  namespace "http://example.com/" do
    id Book, "books/{isbn}"
  end
end
```

For cases, where template consists solely of a template parameter with a property from the schema, an event shorter form is supported by the `id` macro, where the property is written in the typical dot syntax after the schema. In our book example however, we don't have this simple template form, but we can get it simple into that form, by introducing a separate sub namespace, which might have been a good idea in the first place, since it allows us to define a prefix for this namespace. 

```elixir
defmodule Example.IdSpec do
  use Grax.Id.Spec

  namespace "http://example.com/" do
    namespace "books/", prefix: :book do
      id Book.isbn
    end
  end
end
```

Again, this id schema will produce the same ids as the previous forms.

Before we look at more techniques to define id schemas, let's look at how we can use id schemas.


## Using id schemas

With the id schema we've created in the previous section a new book can now be build without having to provide an id:

```elixir
iex> Book.build!(
...>   title: "Exploring Graphs with Elixir",
...>   isbn: "1680508407")
%Book{
  __id__: ~I<http://example.com/books/1680508407>,
  title: "Exploring Graphs with Elixir",
  isbn: "1680508407"
}       
```

This also makes it particularly easy to build nested graph structures, where we can provide linked resources just as a map (as long as everything is included to produce the ids). Let's suppose we also have an `:author` link property in our `Book` schema which links to an `Author` schema with an id schema, which for the sake of simplicity is based on the schema (although this is not a good idea in terms of uniqueness). This allows us to build a our book like this:

```elixir
iex> Book.build!(
...>   title: "Exploring Graphs with Elixir",
...>   isbn: "1680508407")
...>   author: %{first_name: "Tony", last_name: "Hammond"})
%Book{
  __id__: ~I<http://example.com/books/1680508407>,
  title: "Exploring Graphs with Elixir",
  isbn: "1680508407",
  author: [%Author{
    __id__: ~I<http://example.com/authors/Tony_Hammond>,
    first_name: "Tony", 
    last_name: "Hammond"
  }]
}       
```


## Connecting id schemas with Grax schemas

But how are Grax schemas and Grax id specs actually connected? How does Grax know in which id spec to search for an id schema?

The most direct option is to specify the `Grax.Id.Spec` module on a Grax schema with the `id_spec` keyword argument.

```elixir{2}
defmodule Book do
  use Grax.Schema, id_spec: Example.IdSpec
  
  alias NS.SchemaOrg

  schema SchemaOrg.Book do
    property :title, SchemaOrg.name, type: :string, required: true
    property :isbn, SchemaOrg.isbn, type: :string, required: true

    link :author, SchemaOrg.author, type: list_of(Author)
  end
end
```

However, this won't be needed most of the time, since an application will usually have just one id spec for all Grax schemas. This id spec module can be configured with the `:grax_id_spec` key under the configuration of your application. So, for an application with the name `:my_app` this configuration would look like this:

```elixir
use Mix.Config

config :my_app,
  grax_id_spec: Example.IdSpec
```

For all Grax schemas defined in the `:my_app` application the id spec module specified like this will be search for an id schema (unless another id spec module is specified directly with `id_spec` keyword directly in the Grax schema).

For an id schema which directly specifies the Grax schema(s) on which it should be applied, finding the id spec is everything that's needed. The id schema with the matching Grax schema must be simply looked up. On a `build` call the Grax schema is directly available (either the one passed to `Grax.build/2` or the module on which we call the `build/1` function). When the id generation is used to build nested Grax schemas the schema specified as the type of the link property is used for the lookup. For heterogenous properties however the schema is not determined, therefore the automatic building of nested Grax schemas is not supported on heterogenous links and you'll have to build and create the identifier for these manually. 


### Custom schema selectors

Sometimes however we want to define an id schema for whole groups of classes. For example, think of Wikidata URIs, where we have just a few kinds of identifiers. In scenarios like these we don't want to have to enumerate all Grax schemas on an id schema. We can define a custom selector function instead with the `:selector` keyword argument on the `id_schema` macro (the `id` macro works with directly given Grax schemas only). The function will be called with the Grax schema module and the map of key-value pairs which were passed on the `build` function call. It is expected to return a boolean which signals if the id schema on this Grax schema with these values should be applied.

```elixir
defmodule Example.IdSpec do
  use Grax.Id.Spec

  namespace "http://example.com/" do
    id_schema "books/{isbn}", selector: :example_selector
  end

  def example_selector(Book, initial_values) do
    IO.inspect(initial_values)
    true
  end

  def example_selector(_, _), do: false
end
```

In this example we return `true` for all `Book` schema requests, making it essentially behave exactly like our previous examples. We just also output the second argument to demonstrate what else we have available to determine an id schema. 

```elixir
iex> Book.build!(
...>   title: "Exploring Graphs with Elixir",
...>   isbn: "1680508407")
%{isbn: "1680508407", title: "Exploring Graphs with Elixir"}
%Book{
  __id__: ~I<http://example.com/books/1680508407>,
  title: "Exploring Graphs with Elixir",
  isbn: "1680508407"
}       
```


## Custom variables

Obviously, we will not always have a property available to use in our templates. Either we need to process an existing property value or there are template parameters which are completely independent of the properties of a Grax schema. For these situations we can define a variable processing or generating function and associate it with our id schema via the `var_mapping` keyword argument. This function will receive a map of all properties and their values and is expected to return an `:ok` tuple with an updated map which should be used to resolve the variable in the URI template.

Let's say we want to use the slugified title our our `Post` schema from the previous chapters.

```elixir
defmodule Example.IdSpec do
  use Grax.Id.Spec

  namespace "http://example.com/" do
    id Post, "posts/{slug}", var_mapping: :slugify_title
  end

  def slugify_title(%{title: title} = vars) do
    {:ok, 
      Map.put(vars, :slug, 
           title
           |> to_string()
           |> String.downcase()
           |> String.replace(" ", "-")
      )
    }
  end

  def slugify_title(_) do
    {:error, "missing :title value for URI generation"}
  end 
end
```

The passed variables map will also include a special `:__schema__` value with Grax schema for which the id is requested. This can be very useful when the id schema is used for multiple Grax schemas. You can then pattern match on the `:__schema__` field and provide different variable processing logic for the different Grax schemas.

::: warning

You might be wondering why there's no example with a counter-based identifier, although they are so common. There's currently no direct support for counters. But it is planned to provide such support in the next version. For now, you'll have to implement them on your own and add them as a custom variable.
:::

However, instead of having to reach to this last resort, there are some extensions in Grax for some common types of identifiers.


## Hash ids

If you want to base your identifiers on cryptographic hashes, you can use the `hash` macro from the `Grax.Id.Hash` extension. It works as a replacement for the `id` macro and provides an additional `hash` variable for use in the template given with the `:template` keyword argument. The property from which the hash is computed is given with the `:data` keyword argument and the hashing algorithm must be specified with the `:algorithm` argument. The names of the algorithms are passed down to Erlang hash function, so please refer to the [Erlang documentation](https://erlang.org/doc/man/crypto.html#type-hash_algorithm) of your version, for which ones are available.

Let's use our `Post` schema from the last chapters as an example.

```elixir
defmodule Example.IdSpec do
  use Grax.Id.Spec
  import Grax.Id.Hash

  namespace "http://example.com/" do
    hash Post, template: "posts/{hash}", data: :content, algorithm: :sha256
  end
end
```

There are various ways this can be shortened. First, we can introduce again an additional namespace for `posts/`, so that the `template` would become `"{hash}"`, which we can omit, since it is the default template used in the `hash` macro.

```elixir
defmodule Example.IdSpec do
  use Grax.Id.Spec
  import Grax.Id.Hash

  namespace "http://example.com/" do
    namespace "foo/" do
      hash Post, data: :content, algorithm: :sha256
    end
  end
end
```

Next, instead of providing the property with the data for the hashing input with the `:data` keyword argument, it can be given with the dot operator after the schema.

```elixir
defmodule Example.IdSpec do
  use Grax.Id.Spec
  import Grax.Id.Hash

  namespace "http://example.com/" do
    namespace "foo/" do
      hash Post.content, algorithm: :sha256
    end
  end
end
```

If all hash identifiers inside of a namespace should use the same algorithm we can also specify the hash algorithm on the respective namespace with the `:hash_algorithm` keyword argument.

```elixir
defmodule Example.IdSpec do
  use Grax.Id.Spec
  import Grax.Id.Hash

  namespace "http://example.com/", hash_algorithm: :sha256 do
    namespace "foo/" do
      hash Post.content
    end
  end
end
```

When the same hash algorithm should be used throughout the whole id spec, the `:hash_algorithm` can also specified on the `use Grax.Id.Spec`. 

```elixir
defmodule Example.IdSpec do
  use Grax.Id.Spec, 
    hash_algorithm: :sha256

  import Grax.Id.Hash

  namespace "http://example.com/" do
    namespace "foo/" do
      hash Post.content
    end
  end
end
```

All these outer scope `:hash_algorithm` specifications can be overwritten in inner scopes including the id schema itself.


## UUIDs

The `Grax.Id.UUID` extension provides macros for defining UUID id schemas. The most generic one is the `uuid` macros and has the following keyword arguments:

- `:version`: the version of the UUIDs to be generated; it can be 1, 3, 4 or 5 and is required
- `:format`: the format of the UUIDs to be generated; it can be `:default` (which also is the default if not specified) or `:hex`)
- `:namespace`: the namespace to be used for name-based UUIDs of version 3 and 5; it can be `:url`, `:dns`, `:oid`, , `:x500`, `:nil` or another UUID as a string and is required when `:version` is 3 or 5
- `:name_var`: the name of the property of the Grax schema whose value should be used as the basis for the name for which the UUID will be generated; required when `:version` is 3 or 5

The generated is available with the `uuid` variable for the template in the `:template` keyword argument.

We're using our schemas from the last chapters as an example again to demonstrate this.

```elixir
defmodule Example.IdSpec do
  use Grax.Id.Spec
  import Grax.Id.UUID

  @custom_uuid_namespace UUID.uuid5(:dns, "example.domain.com")

  namespace "http://example.com/" do
    uuid User, template: "{uuid}", version: 4, format: :hex
    uuid Comment, 
      template: "{uuid}", 
      version: 5, 
      namespace: @custom_uuid_namespace, 
      name_var: :content,
      format: :hex
  end
end
```

We can apply all of the techniques we saw in the previous sections to make everything more compact. 

1. We can omit the template when it just consists solely of the `uuid` variable. 
2. For the name-based UUIDs in version 3 and 5 we can provide the property for the `:name_var` with the dot operator after the schema. 
3. We can move shared arguments to the namespace by using the equivalent keyword argument just prefixed with the extension name.
4. There are also dedicated macros for the different versions available, which make the `:version` argument implicit.

```elixir
defmodule Example.IdSpec do
  use Grax.Id.Spec
  import Grax.Id.UUID

  @custom_uuid_namespace UUID.uuid5(:dns, "example.domain.com")

  namespace "http://example.com/", uuid_format: :hex do
    uuid4 User
    uuid5 Comment.content, namespace: @custom_uuid_namespace
  end
end
```


## URNs

Grax id schemas for URN identifiers can be defined by using any of the macros for the definition of id schemas, but putting them in special URN namespaces. These namespaces can be defined with the `urn` macro and get a symbol for the namespace identifier instead of a path fragment. The colons before and after the namespace identifier are added automatically, so you won't have to add them in the template.

```elixir
defmodule UrnIds do
  use Grax.Id.Spec

  urn :example do
    id User, "{name}"
  end

  urn :uuid do
    uuid4 Post.content()
  end

  urn :sha1, algorithm: :sha do
    hash Post.content()
  end
end
```

Note, that in the case of the UUID URNs the URN format will be automatically selected. This format is only available in the URN namespaces.


