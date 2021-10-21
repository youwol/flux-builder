/** @format */

export type UiState = UiStateMono | UiStateSplit

export type RenderView = 'builder' | 'editor' | 'grapejs' | 'runner'

export interface UiStateMono {
    kind: 'mono'
    view: RenderView
}

export interface UiStateSplit {
    kind: 'split'
    topView: RenderView
    bottomView: RenderView
}

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

export const confBeta: Conf = {
    initState: defaultSplitBeta,
    defaultMono: defaultMono,
    defaultSplit: defaultSplitBeta,
    defaultBottom: 'editor',
}

export const conf: Conf = {
    initState: defaultSplit,
    defaultMono: defaultMono,
    defaultSplit: defaultSplit,
    defaultBottom: 'grapejs',
}

export interface ViewState {
    isVisible: boolean
    display: 'mono' | 'top' | 'bottom' | 'none'
    classes: string
}

export interface Conf {
    initState: UiState
    defaultMono: UiState
    defaultSplit: UiState
    defaultBottom: RenderView
}
