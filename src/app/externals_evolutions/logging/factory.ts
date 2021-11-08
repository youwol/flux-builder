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
                              backend.logFn(
                                  level as Level,
                                  message,
                                  cbPlacesHolder,
                                  {
                                      name: this.name,
                                  },
                              ),
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

    getChildLogger(childName: string): Logger {
        return loggerFactory(`${this.name}/${childName}`)
    }
}

const loggers: Map<string, Logger> = new Map<string, Logger>()

const thisModuleLog: Logger = new ConcreteLogger('/logging/factory', [
    { backend: backendConsole, level: Level.NOTICE },
])

thisModuleLog.debug(document.documentURI)

loggers.set('/logging/factory', thisModuleLog)

function loggerFactory(path: string): Logger {
    if (loggers.has(path)) {
        thisModuleLog.debug(`Found logger for ${path}`)
        return loggers.get(path)
    }

    thisModuleLog.debug(`constructing logger for ${path}`)

    const backendsLevels: BackendLevel[] = []
    for (const route of getRouting()) {
        thisModuleLog.debug(
            `logger:${path} route:${route.id} level:${route.level}`,
        )

        const routePath: Path = route.paths
            .filter((candidate) => path.startsWith(candidate.path))
            .sort((a, b) => b.path.length - a.path.length)[0]
        thisModuleLog.debug(
            `logger:${path} route:${route.id} path:${routePath.path} level:${routePath.level}`,
        )

        const routeLevel =
            routePath.level > route.level ? routePath.level : route.level
        thisModuleLog.debug(
            `logger:${path} route:${route.id} routeLevel:${routeLevel}`,
        )

        backendsLevels.push(
            ...route.backendsLevels.map((backend): BackendLevel => {
                thisModuleLog.debug(
                    `logger:${path} route:${route.id} backend:${backend.backend.id} level:${backend.level}`,
                )
                const backendLevel =
                    routeLevel > backend.level ? routeLevel : backend.level
                thisModuleLog.debug(
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

export interface LogFactory {
    getChildLogger(name: string): Logger

    getChildFactory(name: string): LogFactory
}

export class Factory implements LogFactory {
    private readonly name

    constructor(name: string) {
        this.name = name
    }

    getChildLogger(childName: string): Logger {
        return loggerFactory(this.getFullChildName(childName))
    }

    getChildFactory(childName: string): LogFactory {
        return new Factory(this.getFullChildName(childName))
    }

    private getFullChildName(childName: string): string {
        return `${this.name}/${childName}`
    }
}

// TODO: take a look at Go concepts for logging : withValue, withDeadline, etc …
export function logFactory(): LogFactory {
    return new Factory('')
}
