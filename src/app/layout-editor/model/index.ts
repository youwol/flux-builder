/** @format */
import { logFactory as parentLogFactory } from '../'
//
// export function logFactory() {
//     return new Factory('/layout-editor').getChildFactory('Model')
// }

export function logFactory() {
    return parentLogFactory.getChildFactory('Model')
}

export * from './model'
export * from './model-component'
export * from './model-module'
export { factoryModel } from './impl/factory'
