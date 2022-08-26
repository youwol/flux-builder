# Flux Builder

The [**Flux Builder** application](https://platform.youwol.com/applications/@youwol/flux-builder/latest) is a
low code solution describing applications using a graphical reactive programming approach.

User guide can be found [here](https://l.youwol.com/doc/@youwol/flux-builder).

Developers' documentation, coverage and bundle's analysis can be found
[here](https://platform.youwol.com/applications/@youwol/cdn-explorer/latest?package=@youwol/flux-builder).

## Installation, Build & Test

To install the required dependencies:

```shell
yarn
```
---
To build for development:

```shell
yarn build:dev
```

To build for production:

```shell
yarn build:prod
```
---
Tests require [py-youwol](https://l.youwol.com/doc/py-youwol)
to run on port 2001 using the configuration defined [here](https://github.com/youwol/integration-tests-conf).

```shell
yarn test
```
---
To start the 'dev-server':
- add `CdnOverride(packageName="@youwol/flux-builder", port=3005)` in your
  [YouWol configuration file](https://l.youwol.com/doc/py-youwol/configuration)
  (in the `dispatches` list).
- run [py-youwol](https://l.youwol.com/doc/py-youwol)
- then execute
  ```shell
  yarn start
  ```

Then, browse to the url `http://localhost:2000/applications/@youwol/flux-builder/latest`
> the port `2000` is the default port for py-youwol, it can be redefined in your py-youwol's configuration file.
---

To generate code documentation:

```shell
yarn doc
```
