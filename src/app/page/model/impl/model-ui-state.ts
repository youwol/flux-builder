/** @format */

import { UiState } from '../model-ui-state'

export const defaultMono: UiState = {
    kind: 'mono',
    view: 'flow-builder',
}

export const defaultSplitRawEditor: UiState = {
    kind: 'split',
    topView: 'editor',
    bottomView: 'builder',
}

export const defaultSplitGrapesEditor: UiState = {
    kind: 'split',
    topView: 'flow-builder',
    bottomView: 'grapes-layout-editor',
}
