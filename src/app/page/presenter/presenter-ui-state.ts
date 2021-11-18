/** @format */

import { Observable } from 'rxjs'
import { Feature, RenderViewName, RenderViewPosition } from '../model'
import { PresenterViewState } from '.'

export interface PresenterUiState {
    split$: Observable<boolean>
    toggleSplit(): void
    toggleView(view: RenderViewName, pos?: RenderViewPosition): void
    getPresenterViewState(
        view: RenderViewName,
        additionalClasses?: string,
    ): PresenterViewState
    hasFeature(feature: Feature): boolean
    alternateUrl: string
}
