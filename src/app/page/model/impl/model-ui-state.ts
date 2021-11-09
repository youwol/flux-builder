/** @format */

import { UiState } from '../model-ui-state'

export const defaultMono: UiState = {
    kind: 'mono',
    view: 'flow-builder',
}

export const defaultSplitBeta: UiState = {
    kind: 'split',
    topView: 'editor',
    bottomView: 'builder',
}

export const defaultSplit: UiState = {
    kind: 'split',
    topView: 'flow-builder',
    bottomView: 'grapes-layout-editor',
}
