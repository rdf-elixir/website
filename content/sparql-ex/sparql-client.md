# Queries against SPARQL endpoints

The major function of the SPARQL.Client is `SPARQL.Client.query/3`, which performs the various forms of SPARQL queries. It takes a SPARQL query string, a SPARQL endpoint URL, and some options. The query is only sent to the endpoint if it is syntactically valid. Depending on the query form either a `SPARQL.Query.Result` struct or an `RDF.Graph` is returned.

For a more detailed description, including the various `SPARQL.Client.query/3` options, see the [API documentation](http://hexdocs.pm/sparql_client/SPARQL.Client.html#query/3).

## Examples

### `SELECT` query

```elixir
# Places with free wi-fi from Wikidata

"""
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

