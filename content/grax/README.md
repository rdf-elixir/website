# Introduction

Grax is a light-weight graph data mapper which maps RDF graph data from [RDF.ex](/rdf-ex/) data structures to schema-conform Elixir structs.

Grax has a very limited scope at the moment. It currently maps only from and to [RDF.ex](/rdf-ex/) graphs and even that in the most basic way. 
You'll have to use [RDF.ex serializers](/rdf-ex/serializations) or the [SPARQL.Client](/sparql-client/) to get the RDF.ex graph on your own.
No SPARQL-query builders. 

This guide is split into two parts:

1. [Schemas](/grax/schemas) which describes the basics of the Grax mapping between graphs and Elixir structs and how to define schemas for that.
2. [API](/grax/api) which introduces the API.

It's assumed that you're familiar with Elixir and have a basic understanding of the RDF data model ([this brief introduction](https://www.ontotext.com/knowledgehub/fundamentals/what-is-rdf/) should be sufficient). 
