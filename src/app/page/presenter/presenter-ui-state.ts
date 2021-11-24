/** @format */

import { Observable } from 'rxjs'
import { RenderViewName, UiState } from '../model'
import { PresenterViewState } from '.'

export interface PresenterUiState {
    uiState$: Observable<UiState>
    addPane(): void
    getPresenterViewState(view: RenderViewName): PresenterViewState
    availableRendersViews: RenderViewName[]
    hiddenRendersViews: RenderViewName[]
    alternateUrl: string
}
