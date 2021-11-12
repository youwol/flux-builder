/** @format */

import { Observable } from 'rxjs'
import { Features, RenderViewName, RenderViewPosition } from '../model'
import { PresenterViewState } from '.'

export interface PresenterUiState {
    split$: Observable<boolean>
    toggleSplit(): void
    toggleView(view: RenderViewName, pos?: RenderViewPosition): void
    getPresenterViewState(
        view: RenderViewName,
        additionalClasses?: string,
    ): PresenterViewState
    readonly features: Features
}
