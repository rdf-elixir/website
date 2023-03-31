# Introduction

RDF Triple Compounds (RTC) is a spec which defines a vocabulary around the concept of _triple compounds_, nestable sub-graphs embedded in RDF-star graphs. This guide is about RTC.ex, an implementation of this spec in Elixir. For an introduction into RTC itself please refer to the [spec](https://w3id.org/rtc).

Triple compounds are sets of triples represented as ordinary RDF resources. 
The triples are assigned as elements of the triple compound via RDF-star statements using the RTC vocabulary. 
Since RDF graphs are basically just sets of triples, triple compounds can be understood as logical RDF graphs inside of a physical RDF graph.

RTC.ex implements a data structure, the `RTC.Compound` struct, which can be used just like a RDF graph. That means you can use it similar to the [`RDF.Graph` structure of RDF.ex](/rdf-ex/data-structures) without having to worry about the RTC vocabulary. The respective RTC statements with the assignments of the elements are handled automatically, so they become transparent.

This guide is structured into the following sections:

1. [Installation](installation) instructions
2. [Basic Graph API](basic-graph-api) introduces the `RTC.Compound` and its API to create and access the sets of triples.
3. [Annotations](annotations) explains how to annotate compounds, which is why you want to use triple compounds in the first place most of the time.
4. [Compound hierarchies](compound-hierarchies) shows how you can define nested hierarchies of compounds.

A basic understanding of RDF.ex is assumed. If this is not given, please consult the [corresponding user guide](/rdf-ex/) first. You should also be familiar with RDF-star. The first two sections of the [RDF-star spec](https://w3c.github.io/rdf-star/cg-spec/2021-12-17.html) should be sufficient to follow this guide.




