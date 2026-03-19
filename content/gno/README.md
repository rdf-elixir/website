# Introduction

Gno is a library for managing RDF datasets in SPARQL triple stores. It provides a unified API that abstracts the differences between storage backends, so you can work with your data the same way regardless of the underlying SPARQL triple store.

Gno uses [DCAT-R](https://w3id.org/dcatr) (Data Catalog Vocabulary for RDF Repositories) for its structural model. DCAT-R extends the W3C's [DCAT](https://www.w3.org/TR/vocab-dcat-3/) vocabulary to describe how RDF repositories are organized internally. In practice, this means your repository structure and configuration are described in RDF itself.

## Core Concepts

### Service, Repository, Dataset

Gno organizes data in a three-level hierarchy:

- A **Service** is the entry point. It combines a repository with a store backend and commit operation configuration.
- A **Repository** is a DCAT-R catalog that contains the dataset and repository metadata.
- A **Dataset** contains the actual RDF data as named graphs.

Services are typically loaded from RDF configuration files (manifests) written in Turtle.

### Changeset System

Gno provides a structured way to express changes to RDF data. A `Gno.Changeset` declares intended changes through four actions: add, update, replace, and remove. Before applying changes, a changeset can be converted to an effective changeset that computes only the minimal changes needed based on the current state of the data.

### Commit System

The commit system applies changesets transactionally with automatic rollback on failure. It supports a middleware pipeline for extensible processing such as validation, logging, and metadata enrichment.

### Store Adapters

Gno supports multiple SPARQL backends through a store adapter system. Built-in adapters are available for:

- **Apache Jena Fuseki**
- **Oxigraph**
- **QLever**
- **Ontotext GraphDB**

You can also configure a generic store with explicit endpoint URLs for any SPARQL 1.1-compatible backend.

## Guide Structure

This guide is structured into the following sections:

1. [Installation](installation) instructions
2. [Configuration](configuration) explains the manifest system and store adapter setup
3. [Querying data](querying-data) covers SPARQL queries and graph retrieval
4. [Managing data](managing-data) covers data updates, changesets, and commits

A basic understanding of RDF.ex is assumed. If this is not given, please consult the [corresponding user guide](/rdf-ex/) first. Familiarity with [SPARQL.ex](/sparql-ex/) and [SPARQL.Client](/sparql-ex/sparql-client) is also helpful but not required.
