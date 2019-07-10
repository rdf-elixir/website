# Default prefixes

By default the configured `RDF.default_prefixes/0` are defined before every query. See the section about [Managing prefixes](/../rdf-ex/serializations) for more on that. So, unless you've configured additional `default_prefixes` or set `use_standard_prefixes` to `false`, you'll get these prefixes implicitly and can use them on every query without having to define them all the time.

```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
```

You can also provide your own query-specific default prefixes with the `default_prefixes` option on the `SPARQL.query/1` function. Setting this option to `nil` or an empty map disables the `default_prefixes` just on a single query.

::: tip
The prefixes you're using in your query are also used for the `RDF.Graph` build with `CONSTRUCT` queries, so it might be useful to also specify additional prefixes in `CONSTRUCT` queries, which are not directly used in your query but in the nodes of the resulting graph (although you can also add those later programmatically with `RDF.Graph.add_prefixes/2`).
:::

