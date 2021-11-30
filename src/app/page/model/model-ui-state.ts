/** @format */

import { RenderViewName } from './model-features'

export type RenderViewPosition = 'top' | 'middle' | 'bottom' | 'none'

export const numberPanes = [1, 2, 3] as const

export type NumberPanes = typeof numberPanes[number]

export interface UiState {
    removeRenderView(renderViewName: RenderViewName): void
    getPosition(renderViewName: RenderViewName): RenderViewPosition
    switchRenderView(
        currentRenderView: RenderViewName,
        otherRenderView: RenderViewName,
    ): void
    numberPanes: NumberPanes
}
