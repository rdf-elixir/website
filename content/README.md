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
    Data structures to build RDF graphs and datasets, which can be loaded and stored in the most popular serializations formats - N-Triples, N-Quads, Turtle, RDF-XML, JSON-LD - and validated with ShEx.
- title: SPARQL.ex
  details: >-
    Perform SPARQL queries against the data in your RDF.ex data structures or any public SPARQL service - Wikidata, Dbpedia, LinkedGeoData, you name it
- title: Grax
  details: >-
    A light-weight graph data mapper which maps RDF graph data from RDF.ex data structures to schema-conform Elixir structs for the domain models of an RDF-based application.
footer: >-
    MIT Licensed | © 2016-2023 Marcel Otto
    
---

```elixir
use RDF

def schema_org_description do
  ~I<https://rdf-elixir.dev>
  |> RDF.type(Schema.Website)
  |> SchemaOrg.about(
       ~I<https://github.com/rdf-elixir/rdf-ex>,
       ~I<https://github.com/rdf-elixir/sparql-ex>,
       ~I<https://github.com/rdf-elixir/grax>
     )
  |> JSON.LD.write_file!("description.jsonld")
end
````
