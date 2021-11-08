/** @format */

import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { v } from '../../../externals_evolutions/logging'
import {
    factoryViewState,
    RenderViewName,
    UiState,
    ViewState,
} from '../../model'
import { logFactory } from '../'

const log = logFactory().getChildFactory('ViewState')

export class PresenterViewState {
    public readonly state$: Observable<ViewState>

    constructor(
        uiState$: Observable<UiState>,
        private readonly view: RenderViewName,
        private readonly additionalClasses: string = '',
    ) {
        this.state$ = uiState$.pipe(
            map((uiState: UiState) => {
                log.getChildLogger('uiState$').debug(
                    'returning viewState for view {0}',
                    v(view),
                )
                return factoryViewState(view, uiState, additionalClasses)
            }),
        )
    }
}
