/** @format */

import { UiState } from '../model-ui-state'

export const defaultMono: UiState = {
    kind: 'mono',
    view: 'flow-builder',
}

export const defaultSplitBeta: UiState = {
    kind: 'split',
    topView: 'flow-builder',
    bottomView: 'raw-editor',
}

export const defaultSplit: UiState = {
    kind: 'split',
    topView: 'flow-builder',
    bottomView: 'grapejs-editor',
}
