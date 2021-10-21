/** @format */

import { getRouting, setBackend, setPath, setRouteLevel } from './routing'

export { LogFactory, logFactory } from './factory'
export { placeHolderModule } from './flux-core'
export { v } from './message'
export { setRouteLevel, setBackend, setPath, getRouting } from './routing'
export { c } from './logging'

window['LogRouting'] = { setRouteLevel, setBackend, setPath, getRouting }
