/** @format */

import { backendAlert, backendConsole } from './backends'
import { Backend, Level } from './logging'

export type BackendLevel = { backend: Backend; level: Level }

export type Route = {
  id: string
  level: Level
  backendsLevels: BackendLevel[]
  paths: Path[]
}

export type Path = {
  path: string
  level: Level
}

export type Routing = Route[]

export const defaultRoutingId = 'default_route'

export function setPath(
  path: string,
  level: Level = Level.DEBUG,
  route: string = defaultRoutingId,
) {
  routing
    .find((candidate) => candidate.id === route)
    .paths.push({ path, level })
}

export function setBackend(
  backend: Backend,
  level: Level = Level.DEBUG,
  route: string = defaultRoutingId,
) {
  routing
    .find((candidate) => candidate.id === route)
    .backendsLevels.push({ backend, level })
}

export function setLevel(level: Level, route: string = defaultRoutingId) {
  routing.find((candidate) => candidate.id === route).level = level
}

const routing: Routing = [
  {
    id: defaultRoutingId,
    level: Level.DEBUG,
    backendsLevels: [{ backend: backendConsole, level: Level.DEBUG }],
    paths: [
      { path: '/', level: Level.INFO },
      { path: '/layout-editor', level: Level.DEBUG },
    ],
  },
  {
    id: 'ALERT',
    level: Level.ALERT,
    backendsLevels: [{ backend: backendAlert, level: Level.ALERT }],
    paths: [{ path: '/', level: Level.ALERT }],
  },
]

export function getRouting(): Routing {
  return clone(routing)
}

// eslint-disable no-irregular-whitespace -- TODO Add exception for comments
/**
 * Taken from https://stackoverflow.com/a/28152032 « Option 4: Deep Copy Function »
 *
 * @param obj
 */
function clone(obj) {
  let copy

  // Handle the 3 simple types, and null or undefined
  if (null == obj || 'object' != typeof obj) {
    return obj
  }

  // Handle Array
  if (Array.isArray(obj)) {
    copy = []
    for (let i = 0, len = obj.length; i < len; i++) {
      copy[i] = clone(obj[i])
    }
    return copy
  }

  // Handle Object
  if (obj instanceof Object) {
    copy = {}
    for (const attr in obj) {
      // eslint-disable-next-line no-prototype-builtins -- Dirty hack
      if (obj.hasOwnProperty(attr)) {
        copy[attr] = clone(obj[attr])
      }
    }
    return copy
  }
}
