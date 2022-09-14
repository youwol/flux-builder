# @youwol/flux-builder

Low code application for YouWol platform

This library is part of the hybrid cloud/local ecosystem
[YouWol](https://platform.youwol.com/applications/@youwol/platform/latest).

## Links

[Running app.](https://platform.youwol.com/applications/@youwol/flux-builder/latest)

[Online user-guide](https://l.youwol.com/doc/@youwol/flux-builder)

[Developers documentation](https://platform.youwol.com/applications/@youwol/cdn-explorer/latest?package=@youwol/flux-builder)

[Package on npm](https://www.npmjs.com/package/@youwol/flux-builder)

[Source on GitHub](https://github.com/youwol/flux-builder)

# Installation, Build, Test

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

To run tests:

```shell
yarn test
```

Coverage can be evaluated using:

```shell
yarn test-coverage
```

---

To start the 'dev-server':

- add `CdnOverride(packageName="@youwol/flux-builder", port=3005)` in your
  [YouWol configuration file](https://l.youwol.com/doc/py-youwol/configuration)
  (in the `dispatches` list).
- start [py-youwol](https://l.youwol.com/doc/py-youwol)
- then execute `yarn start`

The application can be accessed [here](http://localhost:2000/applications/@youwol/flux-builder/latest) (providing py-youwol
running using the default port `2000`).

---

To generate code's documentation:

```shell
yarn doc
```
