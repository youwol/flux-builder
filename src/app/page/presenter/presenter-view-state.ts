/** @format */

import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { logFactory, v } from '../../externals_evolutions/logging'
import { UiState, UiStateMono, UiStateSplit, ViewState } from '../model'

const log = logFactory().getChildFactory('UiState')

export class PresenterViewState {
    public readonly state$: Observable<ViewState>

    constructor(
        uiState$: Observable<UiState>,
        private readonly view: string,
        private readonly additionalClasses: string = '',
    ) {
        this.state$ = uiState$.pipe(
            map((uiState: UiState) => this.mapUiStateToViewState(uiState)),
        )
    }

    private mapUiStateToViewState(uiState: UiState): ViewState {
        return {
            isVisible: isVisible(this.view, uiState),
            display: getViewDisplay(this.view, uiState),
            classes: getUiClass(this.view, uiState, this.additionalClasses),
        }
    }
}

function getViewDisplay(view: string, uiState: UiState) {
    const result =
        uiState.kind === 'mono'
            ? uiState.view === view
                ? 'mono'
                : 'none'
            : uiState.topView === view
            ? 'top'
            : uiState.bottomView === view
            ? 'bottom'
            : 'none'
    log.getChildLogger('getViewDisplay')
        .getChildLogger(`[${view}]`)
        .debug('Display of {0} is {1}', [v(view), v(result)])
    return result
}

function isVisible(view: string, uiState: UiState): boolean {
    log.getChildLogger('isVisible')
        .getChildLogger(`[${view}]`)
        .debug('Asking visibility of {0}', v(view))
    return uiState.kind === 'mono'
        ? uiState.view === view
        : uiState.topView === view || uiState.bottomView === view
}

function getUiClass(
    view: string,
    uiState: UiState,
    additionalClass = '',
): string {
    let _never: never
    switch (uiState.kind) {
        case 'mono':
            return getUiClassMono(view, uiState, additionalClass)
        case 'split':
            return getUiClassSplit(view, uiState, additionalClass)
        default:
            _never = uiState
    }
}

const getUiClassMono: (
    view: string,
    uiState: UiStateMono,
    additionalClass: string,
) => string = (view, uiState, additionalClass) => {
    const result =
        uiState.view === view
            ? `order-1 h-100 ${additionalClass}`
            : 'order-2 d-none'
    log.getChildLogger('Mono')
        .getChildLogger(`[${view}]`)
        .debug("returning classes '{0}' for {1}", [v(result), v(view)])
    return result
}

const getUiClassSplit: (
    view: string,
    uiState: UiStateSplit,
    additionalClass: string,
) => string = (view, uiState, additionalClass) => {
    let result
    if (uiState.topView === view) {
        result = `order-first h-50 ${additionalClass}`
    } else if (uiState.bottomView === view) {
        result = `h-50 ${additionalClass}`
    } else {
        result = 'd-none'
    }
    log.getChildLogger('Split')
        .getChildLogger(`[${view}]`)
        .debug("returning classes '{0}' for {1}", [v(result), v(view)])
    return result
}
