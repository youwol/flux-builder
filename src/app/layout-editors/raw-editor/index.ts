/** @format */

import { logFactory as parentLogFactory } from '../../index'

export function logFactory() {
    return parentLogFactory().getChildFactory('raw-editor')
}

export { factoryRawEditorView } from './view'
