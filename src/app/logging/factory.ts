/** @format */
import { backendConsole } from './backends'
import { CbsPlacesHolder, Level, Logger } from './logging'
import { BackendLevel, getRouting, Path } from './routing'

class ConcreteLogger implements Logger {
  private backends: BackendLevel[]
  private delegate: Map<
    Level,
    (message: string, cbPlacesHolder: CbsPlacesHolder) => void
  > = new Map<
    Level,
    (message: string, cbPlacesHolder: CbsPlacesHolder) => void
  >()
  private readonly name: string

  constructor(name: string, backends: BackendLevel[]) {
    this.name = name
    this.backends = backends
    this.setupDelegate()
  }

  setupDelegate() {
    for (const level of Object.values(Level)) {
      const logFns = this.backends
        .filter((backendLevel) => backendLevel.level <= level)
        .map((backendLevel) => backendLevel.backend)
      this.delegate.set(
        level as Level,
        logFns.length != 0
          ? (message, cbPlacesHolder) =>
              logFns.forEach((backend) =>
                backend.logFn(level as Level, message, cbPlacesHolder, {
                  name: this.name,
                }),
              )
          : (_m, _cb) => {
              /* NOOP */
            },
      )
    }
  }

  removeBackend(id: string) {
    this.backends = this.backends.filter(
      (backendLevel) => backendLevel.backend.id !== id,
    )
    this.setupDelegate()
  }

  setBackend(backendLevel: BackendLevel) {
    if (
      this.backends.find(
        (currentBackendLevel) =>
          backendLevel.backend === currentBackendLevel.backend,
      )
    ) {
      this.setLevel(backendLevel)
    } else {
      this.backends.push(backendLevel)
      this.setupDelegate()
    }
  }

  setLevel(backendLevel: BackendLevel) {
    this.backends.find(
      (currentBackendLevel) =>
        backendLevel.backend === currentBackendLevel.backend,
    ).level = backendLevel.level
    this.setupDelegate()
  }

  debug(message: string, cbPlaceholder?: CbsPlacesHolder): void {
    this.delegate.get(Level.DEBUG)(message, cbPlaceholder)
  }

  info(message: string, cbPlaceholder?: CbsPlacesHolder): void {
    this.delegate.get(Level.INFO)(message, cbPlaceholder)
  }

  notice(message: string, cbPlaceholder?: CbsPlacesHolder): void {
    this.delegate.get(Level.NOTICE)(message, cbPlaceholder)
  }

  warning(message: string, cbPlaceholder?: CbsPlacesHolder): void {
    this.delegate.get(Level.WARNING)(message, cbPlaceholder)
  }

  error(message: string, cbPlaceholder?: CbsPlacesHolder): void {
    this.delegate.get(Level.ERROR)(message, cbPlaceholder)
  }

  fatal(message: string, cbPlaceholder?: CbsPlacesHolder): void {
    this.delegate.get(Level.FATAL)(message, cbPlaceholder)
  }

  alert(message: string, cbPlaceholder?: CbsPlacesHolder): void {
    this.delegate.get(Level.ALERT)(message, cbPlaceholder)
  }

  factory(subPath: string): Logger {
    return factory(`${this.name}/${subPath}`)
  }
}

const loggers: Map<string, Logger> = new Map<string, Logger>()

const logFunctionFactory: Logger = new ConcreteLogger('/logging/factory', [
  { backend: backendConsole, level: Level.WARNING },
])

loggers.set('/logging/factory', logFunctionFactory)

export function factory(path: string): Logger {
  if (loggers.has(path)) {
    logFunctionFactory.debug(`Found logger for ${path}`)
    return loggers.get(path)
  }

  logFunctionFactory.debug(`constructing logger for ${path}`)

  const backendsLevels: BackendLevel[] = []
  for (const route of getRouting()) {
    logFunctionFactory.debug(
      `logger:${path} route:${route.id} level:${route.level}`,
    )

    const routePath: Path = route.paths
      .filter((candidate) => path.startsWith(candidate.path))
      .sort((a, b) => b.path.length - a.path.length)[0]
    logFunctionFactory.debug(
      `logger:${path} route:${route.id} path:${routePath.path} level:${routePath.level}`,
    )

    const routeLevel =
      routePath.level > route.level ? routePath.level : route.level
    logFunctionFactory.debug(
      `logger:${path} route:${route.id} routeLevel:${routeLevel}`,
    )

    backendsLevels.push(
      ...route.backendsLevels.map((backend): BackendLevel => {
        logFunctionFactory.debug(
          `logger:${path} route:${route.id} backend:${backend.backend.id} level:${backend.level}`,
        )
        const backendLevel =
          routeLevel > backend.level ? routeLevel : backend.level
        logFunctionFactory.debug(
          `logger:${path} add backend ${backend.backend.id} with level:${backendLevel}`,
        )
        return {
          backend: backend.backend,
          level: backendLevel,
        }
      }),
    )
  }

  const concreteLogger = new ConcreteLogger(path, backendsLevels)
  loggers.set(path, concreteLogger)
  return concreteLogger
}
