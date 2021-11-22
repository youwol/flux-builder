/** @format */
import { logFactory as parentLogFactory } from '..'

export function logFactory() {
    return parentLogFactory().getChildFactory('View')
}

export { factoryRawEditorView } from './factory-raw-editor.view'
