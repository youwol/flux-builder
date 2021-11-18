/** @format */

import { RenderViewName } from './model-features'
export type UiState = UiStateMono | UiStateSplit

export interface UiStateMono {
    kind: 'mono'
    view: RenderViewName
}

export interface UiStateSplit {
    kind: 'split'
    topView: RenderViewName
    bottomView: RenderViewName
}
