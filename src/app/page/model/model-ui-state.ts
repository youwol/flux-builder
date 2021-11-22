/** @format */

import { RenderViewName } from './model-features'

export type RenderViewPosition = 'top' | 'middle' | 'bottom' | 'none'

export type NumberPanes = 1 | 2 | 3

export interface UiState {
    removeRenderView(renderViewName: RenderViewName): void
    getPosition(renderViewName: RenderViewName): RenderViewPosition
    switchRenderView(
        currentRenderView: RenderViewName,
        otherRenderView: RenderViewName,
    ): void
    numberPanes: NumberPanes
}
