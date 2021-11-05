/** @format */
import { logFactory as parentLogFactory } from '../'

export function logFactory() {
    return parentLogFactory().getChildFactory('Model')
}

export * from './model-app'
export * from './model-component'
export * from './model-module'
export { factoryModel } from './impl/factory'
