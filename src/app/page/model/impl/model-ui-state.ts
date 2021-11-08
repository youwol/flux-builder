/** @format */

import { UiState } from '../model-ui-state'

export const defaultMono: UiState = {
    kind: 'mono',
    view: 'builder',
}

export const defaultSplitBeta: UiState = {
    kind: 'split',
    topView: 'editor',
    bottomView: 'builder',
}

export const defaultSplit: UiState = {
    kind: 'split',
    topView: 'builder',
    bottomView: 'grapejs',
}
