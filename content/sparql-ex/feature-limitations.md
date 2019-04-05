# Feature limitations

SPARQL.ex does currently not support the complete feature set of SPARQL 1.1. Here's a checklist of what's currently supported:

- [ ] SPARQL 1.1 Query Language
    - [x] Basic Graph Pattern matching
    - [x] Group Graph Pattern matching
    - [x] Optional Graph Pattern matching via `OPTIONAL`
    - [x] Alternative Graph Pattern matching via `UNION`
    - [ ] Pattern matching on Named Graphs via `FROM` and `GRAPH`
    - [ ] Solution sequence modification
        - [x] Projection with the `SELECT` clause
        - [x] Assignments to variables in the `SELECT` clause
        - [x] `DISTINCT`
        - [x] `REDUCED`
        - [ ] `ORDER BY`
        - [ ] `OFFSET`
        - [ ] `LIMIT`
    - [x] Restriction of solutions via `FILTER`
    - [x] All builtin functions specified in SPARQL 1.0 and 1.1
    - [x] Ability to define extension functions
    - [x] All XPath constructor functions as specified in the SPARQL 1.1 spec
    - [x] Assignments via `BIND`
    - [x] Negation via `MINUS`
    - [ ] Negation via `NOT EXIST`
    - [ ] Inline Data via `VALUES`
    - [ ] Aggregates via `GROUP BY` and `HAVING`
    - [ ] Subqueries
    - [ ] Property Paths
    - [ ] `ASK` query form
    - [ ] `DESCRIBE` query form
    - [x] `CONSTRUCT` query form
- [ ] SPARQL 1.1 Update
- [x] SPARQL Query Results XML Format
- [x] SPARQL 1.1 Query Results JSON Format
- [x] SPARQL 1.1 Query Results CSV and TSV Formats
- [x] SPARQL 1.1 Protocol (currently client-only with the [SPARQL.Client](/../sparql-client/))
- [ ] SPARQL 1.1 Graph Store HTTP Protocol
- [ ] SPARQL 1.1 Service Description
- [ ] SPARQL 1.1 Federated Query
- [ ] SPARQL 1.1 Entailment Regimes

::: warning
**The [SPARQL.Client](/sparql-client) supports the full SPARQL 1.1 query language**. The missing query language features in this list are just not yet supported by the query engine executing queries against RDF.ex data structures.
:::
