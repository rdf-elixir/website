# Introduction

RDF.ex is an implementation of the [RDF](https://www.w3.org/TR/rdf11-primer/) data model in Elixir. 
It is fully compatible with the RDF 1.1 specification and provides in-memory data structures for RDF descriptions, RDF graphs and RDF datasets, which can be loaded and stored in various serializations formats.

The [RDF standard](http://www.w3.org/TR/rdf11-concepts/) defines a graph data model for distributed information on the web. An RDF graph is a set of statements aka RDF triples consisting of three nodes:

1. a subject node with an IRI or a blank node,
2. a predicate node with the IRI of a RDF property, 
3. an object node with an IRI, a blank node or a RDF literal value.
