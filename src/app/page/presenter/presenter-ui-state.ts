/** @format */

import { Observable } from 'rxjs'
import { NumberPanes, RenderViewName, UiState } from '../model'
import { PresenterViewState } from '.'

export interface PresenterUiState {
    uiState$: Observable<UiState>
    setNumberPanes(numberPanes: NumberPanes): void
    getPresenterViewState(view: RenderViewName): PresenterViewState
    availableRendersViews: RenderViewName[]
    alternateUrl: string
}
