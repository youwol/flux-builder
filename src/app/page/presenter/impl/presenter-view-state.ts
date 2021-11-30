/** @format */

import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import {
    NumberPanes,
    RenderViewName,
    RenderViewPosition,
    UiState,
} from '../../model'
import { logFactory } from '..'
import { ImplPresenterUiState } from './presenter-ui-state'

const log = logFactory().getChildFactory('ViewState')

export class PresenterViewState {
    public readonly state$: Observable<{
        position: RenderViewPosition
        numberPanes: NumberPanes
    }>

    constructor(
        private readonly presenterUiState: ImplPresenterUiState,
        private readonly view: RenderViewName,
    ) {
        this.state$ = presenterUiState.uiState$.pipe(
            map((uiState: UiState) => {
                log.getChildLogger('uiState$').debug(
                    'returning viewState for view {0}',
                    { value: view },
                )
                return {
                    position: uiState.getPosition(view),
                    numberPanes: uiState.numberPanes,
                }
            }),
        )
    }
    close() {
        this.presenterUiState.remove(this.view)
    }
    change(otherViewName: RenderViewName) {
        this.presenterUiState.switch(this.view, otherViewName)
    }
}
