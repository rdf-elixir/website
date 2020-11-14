---
home: true
heroImage: /hero.png
heroText: RDF on Elixir
tagline: "Linked Data ❤ Elixir"
actionText: Get Started →
actionLink: /rdf-ex/
features:
- title: RDF.ex
  details: >-
    Data structures to build RDF graphs and datasets, which can be loaded and stored in the most popular serializations formats - N-Triples, N-Quads, Turtle, RDF-XML, JSON-LD
- title: SPARQL.ex
  details: >-
    Perform SPARQL queries against the data in your RDF.ex data structures or any public SPARQL service - Wikidata, Dbpedia, LinkedGeoData, you name it
- title: ShEx.ex
  details: >-
    Perform validations on the data in your RDF.ex data structures
footer: >-
    MIT Licensed | Copyright © 2017-present Marcel Otto
    
---

```elixir
def schema_org_description do
  ~I<https://rdf-elixir.dev>
  |> RDF.type(Schema.Website)
  |> Schema.about(
       ~I<https://github.com/rdf-elixir/rdf-ex>,
       ~I<https://github.com/rdf-elixir/sparql-ex>,
       ~I<https://github.com/rdf-elixir/shex-ex>
     )
  |> JSON.LD.write_file!("description.jsonld")
end
````
