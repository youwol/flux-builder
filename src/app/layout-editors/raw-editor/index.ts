/** @format */

import { logFactory as parentLogFactory } from '../../index'

export function logFactory() {
    return parentLogFactory().getChildFactory('layout-editor')
}

export { factoryRawEditorView } from './view'
