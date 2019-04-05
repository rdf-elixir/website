# Literals

Literals are used for values such as strings, numbers, and dates. They can be untyped, languaged-tagged or typed. 

## Untyped literals

In general literals are created with the `RDF.Literal.new` constructor function or its alias function `RDF.literal`:

```elixir
RDF.Literal.new("foo")
RDF.literal("foo")
```

The actual value can be accessed via the `value` struct field:

```elixir
RDF.literal("foo").value
```

An untyped literal can also be created with the `~L` sigil:

```elixir
import RDF.Sigils

~L"foo"
```

## Language-tagged literals

A language-tagged literal can be created by providing the `language` option with a [BCP47](https://tools.ietf.org/html/bcp47)-conform language or by adding the language as a modifier to the `~L` sigil:

```elixir
import RDF.Sigils

RDF.literal("foo", language: "en")

~L"foo"en
```

Note: Only languages without subtags are supported as modifiers of the `~L` sigil, i.e. if you want to use `en-US` as a language tag, you would have to use `RDF.literal` or `RDF.Literal.new`.

## Typed literals

A typed literal can be created by providing the `datatype` option with an IRI of a datatype. Most of the time this will be an [XML schema datatype](https://www.w3.org/TR/xmlschema11-2/):

```elixir
RDF.literal("42", datatype: XSD.integer)
```

It is also possible to create a typed literal by using a native Elixir non-string value, for which the following datatype mapping will be applied:

| Elixir datatype | XSD datatype   |
| :-------------- | :------------- |
| `boolean`       | `xsd:boolean`  |
| `integer`       | `xsd:integer`  |
| `float`         | `xsd:double`   |
| `Time`          | `xsd:time`     |
| `Date`          | `xsd:date`     |
| `DateTime`      | `xsd:dateTime` |
| `NaiveDateTime` | `xsd:dateTime` |
| [`Decimal`](https://github.com/ericmj/decimal) | `xsd:decimal`  |

So the former example literal can be created equivalently like this:

```elixir
RDF.literal(42)
```

For all of these known datatypes the `value` struct field contains the native Elixir value representation according to this mapping. When a known XSD datatype is specified, the given value will be converted automatically if needed and possible.

```elixir
iex> RDF.literal(42, datatype: XSD.double).value
42.0
```

For all of these supported XSD datatypes there are `RDF.Datatype`s available that allow the creation of `RDF.Literal`s with the respective datatype. Their `new` constructor function can be called also via the alias functions on the top-level `RDF` namespace.

```elixir
iex> RDF.Double.new("0042").value
42.0

iex> RDF.Double.new(42).value
42.0

iex> RDF.double(42).value
42.0
```

The `RDF.Literal.valid?/1` function checks if a given literal is valid according to the [XML schema datatype](https://www.w3.org/TR/xmlschema11-2/) specification.

```elixir
iex> RDF.Literal.valid? RDF.integer("42")
true

iex> RDF.Literal.valid? RDF.integer("foo")
false
```

If you want to prohibit the creation of invalid literals, you can use the `new!` constructor function of `RDF.Datatype` or `RDF.Literal`, which will fail in case of invalid values.

A RDF literal is bound to the lexical form of the initially given value. This lexical representation can be retrieved with the `RDF.Literal.lexical/1` function:

```elixir
iex> RDF.Literal.lexical RDF.integer("0042")
"0042"

iex> RDF.Literal.lexical RDF.integer(42)
"42"
```

Although two literals might have the same value, they are not equal if they don't have the same lexical form:

```elixir
iex> RDF.integer("0042").value == RDF.integer("42").value
true

iex> RDF.integer("0042") == RDF.integer("42")
false
```

The `RDF.Literal.canonical/1` function returns the given literal with its canonical lexical form according its datatype:

```elixir
iex> RDF.integer("0042") |> RDF.Literal.canonical |> RDF.Literal.lexical
"42"

iex> RDF.Literal.canonical(RDF.integer("0042")) == 
     RDF.Literal.canonical(RDF.integer("42"))
true
```

Note: Although you can create any XSD datatype by using the resp. IRI with the `datatype` option of `RDF.Literal.new`, not all of them support the validation and conversion behaviour of `RDF.Literal`s and the `value` field simply contains the initially given value unvalidated and unconverted. 

::: danger
The `Date` and `DateTime` modules of Elixir versions < 1.7.2 don't handle negative years properly. In case you're data contains negative years in `xsd:date` or `xsd:dateTime` literals, you'll have to upgrade to a newer Elixir version.
:::
