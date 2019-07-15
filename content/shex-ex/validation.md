# Validation

A schema can be provided in two formats: ShExC, the language described in the [ShEx primer](http://shex.io/shex-primer/) or ShExJ, a JSON-based format for shape expressions. Both formats have a dedicated module with a `decode` function to get the ShEx schema from a string in the respective language. 

```elixir
{:ok, schema} = 
  ShEx.ShExC.decode("""
    PREFIX ex: <http://ex.example/#>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX school: <http://school.example/#>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>

    school:enrolleeAge xsd:integer MinInclusive 13 MaxInclusive 20

    school:Enrollee {
      foaf:age @school:enrolleeAge ;
      ex:hasGuardian IRI {1,2}
    }
    """)
```

For both formats there's also a bang variant `decode!` which returns the result directly (not in an ok tuple) and fails in error cases.

RDF data can now be validated with such a schema and a ShapeMap passed to the `ShEx.validate/3` function. For the ShapeMap you can also pass any data structure from which an ShapeMap can be constructed.

```elixir
result_shape_map =
    ShEx.validate(
      RDF.Turtle.read_string!("""
        PREFIX ex: <http://ex.example/#>
        PREFIX inst: <http://example.com/users/>
        PREFIX school: <http://school.example/#>
        PREFIX foaf: <http://xmlns.com/foaf/0.1/>

        inst:Alice foaf:age 13 ;
          ex:hasGuardian inst:Person2, inst:Person3 .

        inst:Bob foaf:age 15 ;
          ex:hasGuardian inst:Person4 .

        inst:Claire foaf:age 12 ;
          ex:hasGuardian inst:Person5 .

        inst:Don foaf:age 14 .
        """),
      ShEx.ShExC.decode!("""
        PREFIX ex: <http://ex.example/#>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        PREFIX school: <http://school.example/#>
        PREFIX foaf: <http://xmlns.com/foaf/0.1/>

        school:enrolleeAge xsd:integer MinInclusive 13 MaxInclusive 20

        school:Enrollee {
          foaf:age @school:enrolleeAge ;
          ex:hasGuardian IRI {1,2}
        }
        """),
      %{
        ~I<http://example.com/users/Alice> => ~I<http://school.example/#Enrollee>,
        ~I<http://example.com/users/Bob> => ~I<http://school.example/#Enrollee>,
        ~I<http://example.com/users/Claire> => ~I<http://school.example/#Enrollee>,
        ~I<http://example.com/users/Don> => ~I<http://school.example/#Enrollee>,
      }
    )
```

The result of the validation is a result ShapeMap for which the associations now have the value `:conformant` or `:nonconformant` in the `status` field of the association. For example:

```elixir
for association <- result_shape_map do
  IO.puts("#{inspect association.node} is #{association.status}")
end
```

will output

```
~I<http://example.com/users/Alice> is conformant
~I<http://example.com/users/Bob> is conformant
~I<http://example.com/users/Claire> is nonconformant
~I<http://example.com/users/Don> is nonconformant
```

The `reason` field of an association contains a list of `ShEx.Violation` structures with details about the reason why it's nonconformant. The fields of these depend on the type of violation. You can get a string representation of any type of violation with the `ShEx.Violation.message/1` function.

If you want to output the failures of the result, instead of filtering the nonconformant associations, you can also access them directly, since the associations are partitioned on a result ShapeMap into the fields `conformant` and `nonconformant`.

```elixir
for association <- result_shape_map.nonconformant do
  IO.puts """
    #{inspect association.node} is not valid because: #{
        association.reason 
        |> Enum.map(&ShEx.Violation.message/1)
        |> Enum.join("\n")
       }
    """
end
```

This will output:

```
~I<http://example.com/users/Claire> is not valid because:
- matched none of at least 1 ~I<http://xmlns.com/foaf/0.1/age> triples
  - %RDF.Literal{value: 12, datatype: ~I<http://www.w3.org/2001/XMLSchema#integer>} is less than 13.0

~I<http://example.com/users/Don> is not valid because:
- matched none of at least 1 ~I<http://ex.example/#hasGuardian> triples
```


## Parallelization

The validation of all the nodes in ShapeMap can also run be run in parallel by passing the option `parallel: true`.

```elixir
result = ShEx.validate(data, schema, shape_map, parallel: true)
```

Under the hood the work of processing the nodes is distributed in batches over your CPUs with the [Flow](https://github.com/plataformatec/flow) library. By default `parallel` is `false`, meaning Flow isn't used at all, since for small amounts of nodes to be validated the usage Flow means a little overhead. You can however make it `true` by default with the following configuration:

```elixir
config :shex,
  parallel: true
```

It is planned that ShEx.ex tries to come up with sensible defaults for the Flow configuration based on the input, but currently without a proper empirical foundation the Flow defaults will be used. So, you're well-advised to have a look at the [Flow documentation](https://hexdocs.pm/flow/Flow.html) and play with its options. The options to `ShEx.validate/4` are passed through to [`Flow.from_enumerable/2`](https://hexdocs.pm/flow/Flow.html#from_enumerable/2`). You can also configure them globally:

```elixir
config :shex,
  flow_opts: [
    max_demand: 100,
    min_demand: 10,
    stages: 8
  ]
```

These default options are used whenever `parallel` is set to true (by default or individually) and no Flow option is provided on a `ShEx.validate/4` call.

You're invited to share your experience or thoughts on the [forum](https://discuss.rdf.community/c/rdf-tooling-libraries/elixir), a [GitHub issue]() or PR.
