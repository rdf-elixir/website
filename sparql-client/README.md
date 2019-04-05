# Introduction

SPARQL.Client is a [SPARQL protocol](https://www.w3.org/TR/sparql11-protocol/) client for Elixir. 

It executes all forms of SPARQL queries against any SPARQL 1.0/1.1-compatible endpoint over HTTP and supports result sets in both XML, JSON, CSV and TSV formats, with JSON being the preferred default for content-negotiation purposes.
Graph results from `CONSTRUCT` queries can be read in any serialization format supported by [RDF.ex](/rdf-ex/serializations) and will be directly deserialized to the respective [RDF.ex data structure](/rdf-ex/data-structures).


The major function of the SPARQL.Client is `SPARQL.Client.query/3`, which performs the various forms of SPARQL queries. It takes a SPARQL query string, a SPARQL endpoint URL, and some options. The query is only sent to the endpoint if it is syntactically valid. Depending on the query form either a `SPARQL.Query.Result` struct or an `RDF.Graph` is returned.

For a more detailed description, including the various `SPARQL.Client.query/3` options, see the [API documentation](http://hexdocs.pm/sparql_client/SPARQL.Client.html#query/3).
