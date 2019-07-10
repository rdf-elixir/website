# Introduction

SPARQL.ex is an implementation of the [SPARQL](http://www.w3.org/TR/sparql11-overview/) standards for Elixir. It allows to execute SPARQL queries against [RDF.ex](/rdf-ex) data structures. 

The implementation of the [SPARQL protocol](https://www.w3.org/TR/sparql11-protocol/) is separated into the `SPARQL.Client` project. It executes SPARQL queries against any SPARQL 1.0/1.1-compatible endpoint over HTTP and supports result sets in both XML, JSON, CSV and TSV formats, with JSON being the preferred default for content-negotiation purposes.
Graph results from `CONSTRUCT` queries can be read in any serialization format supported by [RDF.ex](/rdf-ex/serializations) and will be directly deserialized to the respective [RDF.ex data structure](/rdf-ex/data-structures).
