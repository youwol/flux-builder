/** @format */

import { logFactory as parentLogFactory } from '../..'

export function logFactory() {
    return parentLogFactory().getChildFactory('layout-editor')
}

export { layoutEditorView } from './view'
