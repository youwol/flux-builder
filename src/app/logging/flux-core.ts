/** @format */

import {
  Component,
  GroupModules,
  ModuleFlux,
  PluginFlux,
} from '@youwol/flux-core'
import { placeHolderValue } from './message'

export function placeHolderModule(mdle: ModuleFlux) {
  return placeHolderValue(mdle, (v) => {
    let clazz
    if (v instanceof Component.Module) {
      clazz = 'Component'
    } else if (v instanceof GroupModules.Module) {
      clazz = 'Group'
    } else if (v instanceof PluginFlux) {
      clazz = 'Plugin'
    } else if (v instanceof ModuleFlux) {
      clazz = 'Module'
    } else {
      clazz = 'unknown'
    }
    return `<${clazz}>${v.moduleId}`
  })
}
