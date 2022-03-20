# Queries and updates against SPARQL endpoints

The [SPARQL Protocol](https://www.w3.org/TR/sparql11-protocol/) defines how the operations specified in the SPARQL query and update specs can be requested by a client from a SPARQL service via HTTP. Such SPARQL protocol operations can be requested with the [SPARQL.Client](https://hex.pm/packages/sparql_client) package.

It consists basically of the `SPARQL.Client` module which provides dedicated functions for the various forms of SPARQL query and update operations and generic `query/3` and `update/3` for the query and update operations.

The query functions can be called with a `SPARQL.Query` struct or a SPARQL query as a raw string. By default, a SPARQL query string will be parsed into a `SPARQL.Query` struct for validation purposes before the string is send via an HTTP request to the SPARQL protocol service endpoint. This parsing step can be omitted by setting `:raw_mode` option to `true` on the dedicated
functions for the various SPARQL operation forms.

```
"SELECT * { ?s ?p ?o .}"
|> SPARQL.Client.select("http://example.com/sparql", raw_mode: true)
```

On the generic `SPARQL.Client.query/3` this raw-mode is not supported, since the parsing is needed there to determine the query form which determines which result to expect.

For SPARQL update operations the picture is a little different. The SPARQL.ex package doesn't provide parsing of SPARQL updates (yet), but except for `INSERT` and `DELETE` updates this isn't actually needed, since all elements of the updates can be provided directly to the respective functions for the update forms, which will generate valid SPARQL updates.

```elixir
RDF.Graph.new({EX.S, EX.p, EX.O})
|> SPARQL.Client.insert_data("http://example.com/sparql")
```

You can still provide hand-written update strings to these functions, but due to the lack of SPARQL update parsing the raw-mode is mandatory then. For the `INSERT` and `DELETE` update forms this the only way to request them for now.

```elixir
"""
PREFIX dc:  <http://purl.org/dc/elements/1.1/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

INSERT
{ GRAPH <http://example/bookStore2> { ?book ?p ?v } }
WHERE
{ GRAPH  <http://example/bookStore>
     { ?book dc:date ?date .
       FILTER ( ?date > "1970-01-01T00:00:00-02:00"^^xsd:dateTime )
       ?book ?p ?v
} }
"""
|> SPARQL.Client.insert("http://example.com/sparql", raw_mode: true)
```

For a more detailed description, including the various options, see the [API documentation](http://hexdocs.pm/sparql_client/SPARQL.Client.html).


## SPARQL-star support

The SPARQL-star extensions of the JSON and XML result format are also supported via the standard media-types. Some vendors however, have introduced separate media-types for results with the SPARQL-star extension. You'll have to provide the media-type expected by your vendor via the `:accept_header` option and enforce the respective default result format via the `:result_format` option.

For example, here's how you can receive SPARQL-star results from Ontotext's GraphDB:

```elixir
SPARQL.Client.query(sparql_star_select_query, endpoint,
  accept_header: "application/x-sparqlstar-results+json",
  result_format: :json
)

SPARQL.Client.query(sparql_star_construct_query, endpoint,
  accept_header: "application/x-turtlestar",
  result_format: :turtle
)
```


## Examples

### `SELECT` query

```elixir
# Places with free wi-fi from Wikidata

"""
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX bd: <http://www.bigdata.com/rdf#>

SELECT ?item ?itemLabel (SAMPLE(?coord) AS ?coord)
WHERE {
    ?item wdt:P2848 wd:Q1543615 ;  # wi-fi gratis
          wdt:P625 ?coord .
    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en" }
} GROUP BY ?item ?itemLabel
LIMIT 100
"""
|> SPARQL.Client.query("https://query.wikidata.org/bigdata/namespace/wdq/sparql")
```

`SELECT` query results are returned as a `SPARQL.Query.Result` struct:

```elixir
{:ok, %SPARQL.Query.Result{
   results: [
     %{
         "coord" => ~L"Point(23.32527778 42.695)",
         "item" => ~I<http://www.wikidata.org/entity/Q5123174>,
         "itemLabel" => ~L"City Garden"en
     },
     %{
         "coord" => ~L"Point(24.74138889 42.13444444)",
         "item" => ~I<http://www.wikidata.org/entity/Q7205164>,
         "itemLabel" => ~L"Plovdiv Central railway station"en
     },
     %{
         "coord" => ~L"Point(27.9122 43.1981)",
         "item" => ~I<http://www.wikidata.org/entity/Q7916008>,
         "itemLabel" => ~L"Varna railway station"en
     },
     %{
         "coord" => ~L"Point(23.31966111 42.69133056)",
         "item" => ~I<http://www.wikidata.org/entity/Q7937209>,
         "itemLabel" => ~L"Vitosha Boulevard"en
     },
     ...
   ],
   variables: ["item", "itemLabel", "coord"]
 }
} 
```


### `ASK` query

```elixir
"""
PREFIX : <http://dbpedia.org/resource/>
PREFIX dbo: <http://dbpedia.org/ontology/>

ASK {:Sleepers dbo:starring :Kevin_Bacon }
"""
|> SPARQL.Client.query("http://dbpedia.org/sparql")
```

`ASK` query results are also returned as a `SPARQL.Query.Result` struct, but with the `results` field containing just a boolean result value.

```elixir
{:ok, %SPARQL.Query.Result{results: true, variables: nil}}
```


### `DESCRIBE` query

```elixir
"DESCRIBE <http://dbpedia.org/resource/Elixir_(programming_language)>"
|> SPARQL.Client.query("http://dbpedia.org/sparql")
```

`DESCRIBE` query results are returned as an `RDF.Graph` respective as an `RDF.Dataset` if the format returned by the server supports quads.

```elixir
{:ok, #RDF.Graph{name: nil
      ~I<http://dbpedia.org/resource/Elixir_(programming_language)>
          ~I<http://dbpedia.org/ontology/influenced>
              ~I<http://dbpedia.org/resource/LFE_(programming_language)>
          ~I<http://dbpedia.org/ontology/influencedBy>
              ~I<http://dbpedia.org/resource/Clojure>
              ~I<http://dbpedia.org/resource/Erlang_(programming_language)>
              ~I<http://dbpedia.org/resource/LFE_(programming_language)>
              ~I<http://dbpedia.org/resource/Ruby_(programming_language)>
          ~I<http://dbpedia.org/ontology/license>
              ~I<http://dbpedia.org/resource/Apache_License>
          ~I<http://dbpedia.org/property/creator>
              ~I<http://dbpedia.org/resource/José_Valim>
          ~I<http://dbpedia.org/property/platform>
              ~I<http://dbpedia.org/resource/Erlang_(programming_language)>
          ~I<http://purl.org/linguistics/gold/hypernym>
              ~I<http://dbpedia.org/resource/Language>
          ~I<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>
              ~I<http://dbpedia.org/class/yago/Abstraction100002137>
              ~I<http://dbpedia.org/class/yago/ArtificialLanguage106894544>
              ~I<http://dbpedia.org/class/yago/Communication100033020>
              ~I<http://dbpedia.org/class/yago/Language106282651>
              ~I<http://dbpedia.org/class/yago/ProgrammingLanguage106898352>
              ~I<http://dbpedia.org/class/yago/WikicatProgrammingLanguages>
              ~I<http://dbpedia.org/class/yago/WikicatProgrammingLanguagesCreatedInThe2010s>
              ~I<http://dbpedia.org/ontology/Language>
              ~I<http://dbpedia.org/ontology/ProgrammingLanguage>
              ~I<http://schema.org/Language>
              ~I<http://www.w3.org/2002/07/owl#Thing>
              ~I<http://www.wikidata.org/entity/Q315>
              ~I<http://www.wikidata.org/entity/Q34770>
              ~I<http://www.wikidata.org/entity/Q9143>
          ~I<http://xmlns.com/foaf/0.1/homepage>
              ~I<http://elixir-lang.org>
          ~I<http://xmlns.com/foaf/0.1/name>
              ~L"Elixir"en
    ...
 }    
}  
```


### `CONSTRUCT` query

```elixir
"""
PREFIX : <http://example.org/>
PREFIX dbo: <http://dbpedia.org/ontology/>
PREFIX dbp: <http://dbpedia.org/property/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>

CONSTRUCT { 
    :Elixir
        :name     ?name ;
        :homepage ?homepage ;
        :license  ?license ;
        :creator  ?creator .
}
WHERE  { 
    <http://dbpedia.org/resource/Elixir_(programming_language)> 
        foaf:name     ?name ;
        foaf:homepage ?homepage ;
        dbp:creator   ?creator ;
        dbo:license   ?license .
}
""" 
|> SPARQL.Client.query("http://dbpedia.org/sparql")
```

`CONSTRUCT` query results are also returned as an `RDF.Graph` respective as an `RDF.Dataset` if the format returned by the server supports quads.

```elixir
{:ok, #RDF.Graph{name: nil
      ~I<http://example.org/Elixir>
          ~I<http://example.org/creator>
              ~I<http://dbpedia.org/resource/José_Valim>
          ~I<http://example.org/homepage>
              ~I<http://elixir-lang.org>
          ~I<http://example.org/license>
              ~I<http://dbpedia.org/resource/Apache_License>
          ~I<http://example.org/name>
              ~L"Elixir"en}}
```


### `INSERT` and `DELETE` updates

```elixir
"""
PREFIX dc:  <http://purl.org/dc/elements/1.1/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

INSERT
{ GRAPH <http://example/bookStore2> { ?book ?p ?v } }
WHERE
{ GRAPH  <http://example/bookStore>
     { ?book dc:date ?date .
       FILTER ( ?date > "1970-01-01T00:00:00-02:00"^^xsd:dateTime )
       ?book ?p ?v
} }
"""
|> SPARQL.Client.update("http://example.com/sparql", raw_mode: true)
```

`DELETE` updates work similarly.


### `INSERT DATA` and `DELETE DATA` updates

```elixir
RDF.Graph.new({EX.S, EX.p, EX.O})
|> SPARQL.Client.insert_data("http://example.com/sparql")
```

```elixir
EX.S
|> EX.p(EX.O)
|> SPARQL.Client.delete_data("http://example.com/sparql")
```


### `LOAD` update

```elixir
SPARQL.Client.load("http://example.com/sparql", from: "http://example.com/Resource")
```


### `CLEAR` update

```elixir
SPARQL.Client.clear("http://example.com/sparql", graph: EX.Graph)
```

```elixir
SPARQL.Client.clear("http://example.com/sparql", graph: :all, silent: true)
```


### `CREATE` graph management operation

```elixir
SPARQL.Client.create("http://example.com/sparql", graph: EX.Graph)
```


### `DROP` graph management operation

```elixir
SPARQL.Client.drop("http://example.com/sparql", graph: EX.Graph)
```

```elixir
SPARQL.Client.drop("http://example.com/sparql", graph: :named)
```


### `COPY` graph management operation

```elixir
SPARQL.Client.copy("http://example.com/sparql",
   from: "http://example.com/Graph1", to: "http://example.com/Graph2")
```

```elixir
SPARQL.Client.copy("http://example.com/sparql",
  from: :default, to: EX.Graph, silent: true)
```


### `MOVE` graph management operation

```elixir
SPARQL.Client.move("http://example.com/sparql",
   from: "http://example.com/Graph1", to: "http://example.com/Graph2")
```

```elixir
SPARQL.Client.move("http://example.com/sparql",
  from: :default, to: EX.Graph, silent: true)
```


### `ADD` graph management operation

```elixir
SPARQL.Client.add("http://example.com/sparql",
   from: "http://example.com/Graph1", to: "http://example.com/Graph2")
```

```elixir
SPARQL.Client.add("http://example.com/sparql",
  from: :default, to: EX.Graph, silent: true)
```

