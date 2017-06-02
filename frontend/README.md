# Frontend

This folder contains the source code and configuration to build and test the web frontend.

## Prerequisites

The dependencies of this package must be installed to test or build.
```bash
npm install
```

## Test

To run the tests use:
```bash
npm test
```
This runs all tests located in the `test` directory.

##### Write your own tests

To write your own tests, create a new file in the `test` directory. You can write multiple tests into the same file. The testing framework used is
[Jest](https://facebook.github.io/jest/).

Example test:
```javascript
it("adds up 1 and 2 to 3", () => {
    const sum = require("../src/sum");

    expect(sum(1,2)).toBe(3);
});
```
Consult the Jest documentation for details on how to write tests.

## Build

To build the interpreter and optimize for production:
```bash
npm run build
```
This will create a directory `build` containing all necessary files to deploy the project.