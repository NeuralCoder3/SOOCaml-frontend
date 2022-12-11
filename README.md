# OCaml Version of SOSML

The goal is to update SOSML to support OCaml.

There are multiple ways to do this:
- [ ] Extension:
  * Write a OCaml -> SML transpiler for parsing
  * Write a postprocessor for the SML output
- [ ] The clean way: 
  * 
* A new interpreter
  * Use an OCaml interpreter instead of the SML interpreter
  * We are closer to the OCaml semantics 
  * No need to worry about the differences between SML and OCaml
  * No transpiler or SML adaptation needed
  * We have less control
  * We have no full roll-back partial evaluation of code blocks (possible via tricks or toplevel adaptation)
  * The OCaml toplevel can be compiled to Javascript using the [js_of_ocaml]http://ocsigen.org/js_of_ocaml/latest/manual/overview) project ([Github](https://github.com/ocsigen/js_of_ocaml))
    * A toplevel example can be found [here](https://github.com/ocsigen/js_of_ocaml/tree/master/toplevel/examples/lwt_toplevel)
    * The current interpreter [TryOCaml](https://try.ocamlpro.com/) ([Github](https://github.com/OCamlPro/tryocaml)) also uses this project
    * A standalone toplevel is easy to obtain (see example [here](https://github.com/ocsigen/js_of_ocaml/issues/629))
  - [ ] The cleaner way
    * Wrap the toplevel in a way that exposes functions that the [SML interpreter](https://github.com/NeuralCoder3/SOOcaml) uses
    * Rewrite the [worker](https://github.com/NeuralCoder3/SOOcaml-webworker) to use the (wrapped) OCaml toplevel
    * Use the worker in the [frontend](https://github.com/NeuralCoder3/SOOCaml-frontend) ([here](https://github.com/NeuralCoder3/SOOCaml-frontend/blob/main/frontend/src/components/CodeMirrorWrapper.tsx)) (no adaptation required)
  - [x] The easier way:
    * Just ignore the interpreter and worker
    * Force the editor to execute its code via the evaluator (transpiled OCaml toplevel)

Differences OCaml and SML:
* [Comparison by Andreas Rossberg](https://people.mpi-sws.org/~rossberg/sml-vs-ocaml.html)
* [Comparison by Adam Chlipala](http://adam.chlipala.net/mlcomp/)
* Vectors, StdLib, lazy evaluation, ...

Links:
* [OCaml to Javascript (Js_Of_OCaml)](https://github.com/ocsigen/js_of_ocaml)
* [Other OCaml to web project](https://github.com/sabine/ocaml-to-wasm-overview#runtime-garbage-collection)
* [Original SOSML](https://sosml.org/)
* [Camlp5](https://github.com/camlp5/camlp5)

Information about the SOSML projects:
* The core project [SOSML](https://github.com/NeuralCoder3/SOOcaml) contains the SML logic and the interpreter
* The [webworker](https://github.com/NeuralCoder3/SOOcaml-webworker) wrappes the interpreter and exposes it as javascript file that can be included in other projects
* The [frontend](https://github.com/NeuralCoder3/SOOCaml-frontend) uses the worker in the [editor component](https://github.com/NeuralCoder3/SOOCaml-frontend/blob/main/frontend/src/components/CodeMirrorWrapper.tsx)

Note: 
The npm commands might need `export NODE_OPTIONS=--openssl-legacy-provider`.

# SOSML - Frontend

A frontend for SOSML, used by sosml.org, that has different themes (with dark mode
support) and allows for saving SML code in the browser.

# Installation Instructions

## Prerequisites

Node.JS version 8 or higher and NPM version 5 or higher need to be installed on the system. GNU+Linux is recommended.
```
git clone https://github.com/SOSML/SOSML-frontend.git
```

## Install/Update all NPM dependencies
To install or(non-exclusive or) update all NPM dependencies run `npm i` in the frontend folder.

## Building and Running  frontend

The frontend can be run locally with `npm run start`, this will use a compiled version of the
webworker placed in the `frontend/public` server to actually run SML code. To obtain
optimized files suitable for production, use `npm run build` to populate tho `build`
folder. The files in the `build` folder are then suitable to be served on a static web
server. (Consult the SOSML-backend repository on how to run a non-static server that
allows for file uploading/sharing.)
