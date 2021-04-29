# Jam engine
**Please note: this repository has been archived!**

A game jam engine.


## Getting started
### Building in-place
The simplest way to start using Jam is to install and build in the same
location as the repository:

    npm install  # Install NPM dependencies.
    make typings-install  # Install TypeScript definitions.
    make js  # Or just `make`. This builds the Jam source.

### Building as a dependency of another project
To `npm install` Jam as a dependency of another TypeScript project, it may be
easier to create a separate `jam.tsconfig.json` configuration in that project's
repository and build there (since the TypeScript compiler will have been
installed to the top-level project's `node_modules` directory). This is the
option taken by the
[asteroids clone](https://github.com/coxm/jam-asteroids-clone) project.


## Testing
Jam comes with a lot of tests. You can build the tests with

    make tests

then run them with

    make test

You can also view the test coverage by running

    make coverage

and pointing your browser at `build/coverage/html/index.html`.
