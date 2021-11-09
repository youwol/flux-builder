/** @format */
import { logFactory as parentLogFactory } from '..'

export function logFactory() {
    return parentLogFactory().getChildFactory('View')
}

export { layoutEditorView } from './layout-editor.view'
