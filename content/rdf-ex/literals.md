# Literals

Literals are used for values such as strings, numbers, and dates. They can be untyped, languaged-tagged or typed (but following the RDF 1.1 spec untyped literals are in fact just `xsd:string` typed literals)


## Untyped literals

In general literals are created with the `RDF.Literal.new` constructor function or its alias function `RDF.literal`:

```elixir
RDF.Literal.new("foo")
RDF.literal("foo")
```

The actual value can be accessed via the `RDF.Literal.value/1` function:

```elixir
iex> RDF.literal("foo") |> RDF.Literal.value()
"foo"
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
RDF.literal("foo", "en")

~L"foo"en
```

Note: Only languages without subtags are supported as modifiers of the `~L` sigil, i.e. if you want to use `en-US` as a language tag, you would have to use the constructor functions.


## Typed literals

A typed literal can be created by providing the `datatype` option with an IRI of a datatype. Most of the time this will be an [XML schema datatype](https://www.w3.org/TR/xmlschema11-2/):

```elixir
alias RDF.NS

RDF.literal("42", datatype: NS.XSD.integer)
```

It is also possible to create a typed literal by using a native Elixir non-string value, for which the following datatype mapping will be applied:

| Elixir datatype | XSD datatype   |
| :-------------- | :------------- |
| `string`        | `xsd:string`   |
| `boolean`       | `xsd:boolean`  |
| `integer`       | `xsd:integer`  |
| `float`         | `xsd:double`   |
| [`Decimal`](https://github.com/ericmj/decimal) | `xsd:decimal`  |
| `Time`          | `xsd:time`     |
| `Date`          | `xsd:date`     |
| `DateTime`      | `xsd:dateTime` |
| `NaiveDateTime` | `xsd:dateTime` |
| `URI`           | `xsd:AnyURI`   |


So the former example literal can be created equivalently like this:

```elixir
RDF.literal(42)
```

The `value/1` function returns the literal value as the native Elixir value according to the above mapping. When a known XSD datatype is specified, the given value will be converted automatically if needed and possible.

```elixir
iex> RDF.literal(42, datatype: NS.XSD.double) |> RDF.Literal.value()
42.0

iex> RDF.literal("0042", datatype: NS.XSD.byte) |> RDF.Literal.value()
42
```

::: warning
For some datatypes where the value space of the XSD datatype is larger than what the corresponding Elixir datatype supports, you might also get a tuple with annotations back. For example, `xsd:date`s and `xsd:time`s support timezones while Elixir's `Date` and `Time` structs don't support that. In case of an `xsd:date` with a timezone you'll get a tuple like this `{~D[2014-09-01], "-08:00"}`. For `xsd:time`s with timezones you'll instead just get a tuple like `{~T[23:00:00], true}` with a boolean signifying that it has a timezone, since the timezone offset was already normalized in the value (the original timezone offset is kept in the lexical form).
:::

For all of the supported RDF and XSD datatypes there are `RDF.Literal.Datatype` modules available that implement the semantics of the respective datatype.
They also provide a `new` constructor function that allows the creation of `RDF.Literal`s with the respective datatype. These constructor can also be called via the alias functions on the top-level `RDF` respective `RDF.XSD` namespace.

```elixir
# we'll consider the following alias to be defined throughout this guide implicitly
alias RDF.XSD

XSD.String.new("foo")
XSD.string("foo")
XSD.integer(42)
XSD.byte(42)
RDF.LangString.new("foo", language: "en")
RDF.langString("foo", language: "en")
```

Besides the `RDF.LangString` datatype the following XSD datatypes are provided as `RDF.Literal.Datatype`s:

| XSD datatype | `RDF.Literal.Datatype` |
| :-------------- | :------------- |
| `xsd:boolean` | `RDF.XSD.Boolean` |
| `xsd:float` | `RDF.XSD.Float` |
| `xsd:double` | `RDF.XSD.Double` |
| `xsd:decimal` | `RDF.XSD.Decimal` |
|   `xsd:integer` | `RDF.XSD.Integer` |
|     `xsd:long` | `RDF.XSD.Long` |
|       `xsd:int` | `RDF.XSD.Int` |
|         `xsd:short` | `RDF.XSD.Short` |
|           `xsd:byte` | `RDF.XSD.Byte` |
|     `xsd:nonPositiveInteger` | `RDF.XSD.NonPositiveInteger` |
|       `xsd:negativeInteger` | `RDF.XSD.NegativeInteger` |
|     `xsd:nonNegativeInteger` | `RDF.XSD.NonNegativeInteger` |
|       `xsd:positiveInteger` | `RDF.XSD.PositiveInteger` |
|       `xsd:unsignedLong` | `RDF.XSD.UnsignedLong` |
|         `xsd:unsignedInt` | `RDF.XSD.UnsignedInt` |
|           `xsd:unsignedShort` | `RDF.XSD.UnsignedShort` |
|             `xsd:unsignedByte` | `RDF.XSD.UnsignedByte` |
| `xsd:string` | `RDF.XSD.String` |
|   `xsd:normalizedString` | ❌ |
|     `xsd:token` | ❌ |
|       `xsd:language` | ❌ |
|       `xsd:Name` | ❌ |
|         `xsd:NCName` | ❌ |
|           `xsd:ID` | ❌ |
|           `xsd:IDREF` | ❌ |
|           `xsd:ENTITY` | ❌ |
|       `xsd:NMTOKEN` | ❌ |
| `xsd:dateTime` | `RDF.XSD.DateTime` |
|   `xsd:dateTimeStamp` | ❌ |
| `xsd:date` | `RDF.XSD.Date` |
| `xsd:time` | `RDF.XSD.Time` |
| `xsd:duration` | ❌ |
|  `xsd:dayTimeDuration` | ❌ |
|  `xsd:yearMonthDuration` | ❌ |
| `xsd:gYearMonth` | ❌ |
| `xsd:gYear` | ❌ |
| `xsd:gMonthDay` | ❌ |
| `xsd:gDay` | ❌ |
| `xsd:gMonth` | ❌ |
| `xsd:base64Binary` | ❌ |
| `xsd:hexBinary` | ❌ |
| `xsd:anyURI` | `RDF.XSD.AnyURI` |
| `xsd:QName` | ❌ |
| `xsd:NOTATION` | ❌ |

For literals with an unknown datatype, i.e. a datatype without a `RDF.Literal.Datatype` module the generic `RDF.Literal.Generic` implementation s used. For those generic literals the  `RDF.Literal.value/1` function simply returns the initially given value unvalidated and unconverted. 

## Validation

The `RDF.Literal.valid?/1` function checks if a given literal is valid according to the semantics in its `RDF.Literal.Datatype` implementation.

```elixir
iex> RDF.Literal.valid? XSD.integer("42")
true

iex> RDF.Literal.valid? XSD.integer("foo")
false
```

Since the semantics of `RDF.Literal.Generic` literals is unknown they are always considered to be valid.

If you want to prohibit the creation of invalid literals, you can use the `new!` constructor function of the `RDF.Literal.Datatype` or `RDF.Literal`, which will fail in case of invalid values.


## Lexical and canonical form

A RDF literal is bound to the lexical form of the initially given value. This lexical representation can be retrieved with the `RDF.Literal.lexical/1` function:

```elixir
iex> RDF.Literal.lexical XSD.integer("0042")
"0042"

iex> RDF.Literal.lexical XSD.integer(42)
"42"
```

The `RDF.Literal.canonical/1` function normalizes the given literal to the canonical lexical form according to its datatype:

```elixir
iex> RDF.integer("0042") |> RDF.Literal.canonical |> RDF.Literal.lexical
"42"

iex> RDF.Literal.canonical(RDF.integer("0042")) == 
     RDF.Literal.canonical(RDF.integer("42"))
true
```

For `RDF.Literal.Generic` literals the `canonical` function returns the given literal unchanged.

Since the canonical form is undefined for invalid literals, `nil` is returned in this case.

If you're just interested in the canonical lexical form as a string you can also use the `RDF.Literal.canonical_lexical/1` function, which is also a bit faster, since the intermediary canonicalization is not needed.

```elixir
iex> RDF.Literal.canonical_lexical XSD.integer("0042")
"42"
```

## Equivalence

Although two literals might have the same value, they are not equal if they don't have the same lexical form:

```elixir
iex> RDF.Literal.value(XSD.integer("0042")) == RDF.Literal.value(XSD.integer("42"))
true

iex> XSD.integer("0042") == XSD.integer("42")
false
```

The `RDF.Literal.equal_value?/2` function however, does a pure value-based equivalence comparison. It also takes into account compatibilities between different types, eg. derived datypes. Since it is the basis for the implementation of SPARQLs `=` operator in SPARQL.ex everything that is equivalent in terms of this operator will match. Literals which aren't comparable in general due to their type and would result in an error match in terms of the SPARQL `=` operator (meaning that also the negation wouldn't match) will return `nil`. Above this, it also coerces native Elixir values to `RDF.Literal`s before doing the comparison.

```elixir
iex> XSD.integer("0042") |> RDF.Literal.equal_value?(XSD.integer("42"))
true

iex> XSD.integer("0042") |> RDF.Literal.equal_value?(42)
true

iex> XSD.integer("0042") |> RDF.Literal.equal_value?(XSD.short(42))
true

iex> XSD.anyURI("http://example.com") |> RDF.Literal.equal_value?(RDF.iri("http://example.com"))
true

iex> XSD.integer("0042") |> RDF.Literal.equal_value?(XSD.string("42"))
nil
```


## Defining custom datatypes

You can define your own custom datatype by implementing the `RDF.Literal.Datatype` behaviour. Defining a completely independent dataype however, will probably be the exception and goes beyond the scope of this introductary guide. Most of the time you want to introduce a custom datatype by constraining one of the existing XSD datatypes through datatype derivation. 

::: danger
It should be noted that a triple store won't know how to handle your custom datatype unless it's a well-known datatype he supports, so they should be introduced cautiously. But at least in the RDF.ex libraries they will behave like the predefined XSD datatypes. In particular you can apply the respective SPARQL functions within SPARQL.ex on them.
:::

So, a custom datatype can be derived from a XSD datatype (with an existing `RDF.Literal.Datatype` implementation) by defining a new module with `use RDF.XSD.Datatype.Restriction` and constraining its value space. RDF.ex implements most of the [XSD facets](https://www.w3.org/TR/xmlschema-2/#rf-facets) as `RDF.XSD.Facet` modules for this:

| XSD facet        | `RDF.XSD.Facet`                   |
| :--------------  | :-------------                    |
| length           | `RDF.XSD.Facets.Length`           |
| minLength        | `RDF.XSD.Facets.MinLength`        |
| maxLength        | `RDF.XSD.Facets.MaxLength`        |
| maxInclusive     | `RDF.XSD.Facets.MaxInclusive`     |
| maxExclusive     | `RDF.XSD.Facets.MaxExclusive`     |
| minInclusive     | `RDF.XSD.Facets.MinInclusive`     |
| minExclusive     | `RDF.XSD.Facets.MinExclusive`     |
| totalDigits      | `RDF.XSD.Facets.TotalDigits`      |
| fractionDigits   | `RDF.XSD.Facets.FractionDigits`   |
| explicitTimezone | `RDF.XSD.Facets.ExplicitTimezone` |
| pattern          | `RDF.XSD.Facets.Pattern`          |
| whiteSpace       | ❌                                |
| enumeration      | ❌                                |
| assertions       | ❌                                |

Within the body of a module using  `RDF.XSD.Datatype.Restriction` you can apply one or multiple of these facets with the `def_facet_constraint` macro and specifying a value for the facets. This table shows which facets can be applied on the primitive datatypes (and their derived datatypes):

| Primitive datatype | Applicable facets |
| :----------------- | :---------------- |
|string | length, maxLength, minLength, pattern |
|boolean | pattern |
|float | maxExclusive, maxInclusive, minExclusive, minInclusive, pattern |
|double | maxExclusive, maxInclusive, minExclusive, minInclusive, pattern |
|decimal | maxExclusive, maxInclusive, minExclusive, minInclusive, pattern, totalDigits, fractionDigits |
|integer | maxExclusive, maxInclusive, minExclusive, minInclusive, pattern, totalDigits |
|duration | maxExclusive, maxInclusive, minExclusive, minInclusive, pattern |
|dateTime | explicitTimezone, maxExclusive, maxInclusive, minExclusive, minInclusive, pattern |
|time | explicitTimezone, maxExclusive, maxInclusive, minExclusive, minInclusive, pattern |
|date | explicitTimezone, maxExclusive, maxInclusive, minExclusive, minInclusive, pattern |
|anyURI | length, maxLength, minLength, pattern |


Let's see how a custom datatype for the age of a person could be defined in an application:

```elixir
defmodule MyApp.PersonAge do
  use RDF.XSD.Datatype.Restriction,
      name: "person_age",
      id: "http://example.com/person_age",
      base: RDF.XSD.NonNegativeInteger

  def_facet_constraint RDF.XSD.Facets.MaxInclusive, 150
end
```

This datatype can now constructed by either its `new` constructor or via the generic typed  `RDF.Literal` constuctor and the specified datatype URI.

```elixir
iex> MyApp.PersonAge.new(42)
%RDF.Literal{literal: %MyApp.PersonAge{value: 42, lexical: "42"}, valid: true}

iex> RDF.literal(42, datatype: "http://example.com/person_age")
%RDF.Literal{literal: %MyApp.PersonAge{value: 42, lexical: "42"}, valid: true}
```

Within RDF.ex and the libraries on top of it (SPARQL.ex, ShEx.ex) this datatype can be used wherever a `xsd:nonNegativeInteger` or `xsd:integer` is expected.

```elixir
iex> XSD.integer(42) |> RDF.Literal.equal_value?(MyApp.PersonAge.new(42))
true
```


## Type checking and reflection

The datatype IRI of any `RDF.Literal` can be retrieved with the `RDF.Literal.datatype_id/1` function.

```elixir
iex> XSD.integer(42) |> RDF.Literal.datatype_id()
~I<http://www.w3.org/2001/XMLSchema#integer>

iex> ~L"foo"en |> RDF.Literal.datatype_id()
~I<http://www.w3.org/1999/02/22-rdf-syntax-ns#langString>

iex> RDF.literal("foo", datatype: "http://example.com/dt") |> RDF.Literal.datatype_id()
~I<http://example.com/dt>
```

Although you won't need this most of the time, since you can use all types of literals via the polymorphic `RDF.Literal` functions, the inverse operation is also possible. When a `RDF.Literal.Datatype` is defined for a datatype IRI, you can get the module dynamically by its IRI with the `RDF.Literal.Datatype.get/1` function.

```elixir
iex> RDF.Literal.Datatype.get("http://www.w3.org/2001/XMLSchema#integer")
RDF.XSD.Integer

iex> RDF.Literal.Datatype.get("http://example.com/custom/datatype")
My.Custom.Datatype

# assuming there's no custom RDF.Literal.Datatype for http://example.com/dt defined
iex> RDF.Literal.Datatype.get("http://example.com/dt")
nil
```


An `RDF.Literal` with a datatype for which a `RDF.Literal.Datatype` is defined can be pattern matched via its `literal` field and the module implementing the `RDF.Literal.Datatype`.

```elixir
def fun(%RDF.Literal{literal: %XSD.Integer{}} = integer_literal), do: ...

def fun(%RDF.Literal{literal: %My.Custom.Datatype{}} = my_literal), do: ...
```

Literals with a datatype for which no `RDF.Literal.Datatype` is defined can be pattern matched via the `datatype` of the `RDF.Literal.Generic` datatype.

```elixir
# assuming there's no custom RDF.Literal.Datatype for http://example.com/dt defined
def fun(%RDF.Literal{literal: %RDF.Literal.Generic{datatype: "http://example.com/dt"}} = literal), do: ...
```

Although pattern matching is the most elegant way for type checks, this only allows for exact datatype matches. The `datatype?/1` functions on the individual `RDF.Literal.Datatype` modules are aware of derivations and check whether the datatype of a given literal is either the datatype for which the `RDF.Literal.Datatype` is defined or derived of this datatype.

```elixir
iex> XSD.integer(42) |> XSD.Integer.datatype?()
true

iex> XSD.byte(42) |> XSD.Integer.datatype?()
true

iex> XSD.byte(42) |> XSD.UnsignedInteger.datatype?()
true

iex> XSD.byte(42) |> XSD.NegativeInteger.datatype?()
false

iex> XSD.byte(42) |> XSD.Decimal.datatype?()
TODO: ??? 

# assuming My.Custom.Datatype is derived from xsd:integer or one of its derived datatypes
iex> My.Custom.Datatype.new(42) |> XSD.Integer.datatype?()
true

# assuming there's a custom RDF.Literal.Datatype for http://example.com/dt defined and it is derived from a xsd:integer
iex> RDF.literal("foo", datatype: "http://example.com/dt") |> XSD.Integer.datatype?()
true
```

The `RDF.XSD.Numeric.datatype?/1` function can also be handy. It checks if the datatype of a literal is one of the numeric XSD datatypes or derived from one of them. 

```elixir
iex> XSD.integer(42) |> XSD.Numeric.datatype?()
true

iex> XSD.string("foo") |> XSD.Numeric.datatype?()
false

# assuming My.Custom.Datatype is derived from a numeric XSD datatype
iex> My.Custom.Datatype.new(42) |> XSD.Numeric.datatype?()
true

# assuming there's no custom RDF.Literal.Datatype for http://example.com/dt defined or it is not derived from a numeric XSD datatype
iex> RDF.literal("foo", datatype: "http://example.com/dt") |> XSD.Numeric.datatype?()
false
```

The general purpose type check function `RDF.Literal.is_a?/2` supports all of these `datatype?/1` functions

```elixir
iex> XSD.byte(42) |> RDF.Literal.is_a?(XSD.Byte)
true

iex> XSD.byte(42) |> RDF.Literal.is_a?(XSD.Integer)
true

iex> XSD.byte(42) |> RDF.Literal.is_a?(XSD.Numeric)
true

iex> XSD.byte(42) |> RDF.Literal.is_a?(XSD.Datatype)
true

iex> RDF.langString("foo", language: "en") |> RDF.Literal.is_a?(XSD.Datatype)
false

# assuming there's no custom RDF.Literal.Datatype for http://example.com/dt
iex> RDF.literal("foo", datatype: "http://example.com/dt") |> RDF.Literal.is_a?(RDF.Literal.Generic)
true
```

Most of the functions on the `RDF.Literal.Datatype` modules are only applicable on literals of exact this datatype, but there are two notable exceptions which can be handy. 

The `valid?/1` function on `RDF.Literal.Datatype` modules is able to deal with derived datatypes and returns `true` if the given literal is valid AND of the proper type.

```elixir
iex> XSD.byte(42) |> XSD.Integer.valid?()
true

iex> XSD.float(3.14) |> XSD.Integer.valid?()
false
```

The `value/1` function on the `RDF.Literal.Datatype` modules also returns the value of literals when they are of a derived datatype (or `nil` if the datatype is not derived from this datatype.

```elixir
iex> XSD.byte(42) |> XSD.Integer.value()
42

iex> XSD.float(3.14) |> XSD.Integer.value()
nil
```

