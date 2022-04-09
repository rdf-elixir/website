# Blank nodes

Blank nodes are nodes of an RDF graph without an IRI. They are always local to that graph and mostly used as helper nodes. 

They can be created with `RDF.BlankNode.new` or its alias function `RDF.bnode`. You can either pass an atom, string, integer or Erlang reference with a custom local identifier or call it without any arguments, which will create a local identifier automatically.

```elixir
RDF.bnode(:foo)
RDF.bnode(42)
RDF.bnode
```

You can also use the `~B` sigil to create a blank node with a custom name:

```elixir
import RDF.Sigils

~B<foo>
```

The `~b` sigil which supports string interpolation is also available:

```elixir
import RDF.Sigils

~B<foo#{i}>
```

