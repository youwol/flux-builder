/** @format */

import { v } from '../../../externals_evolutions/logging'
import { logFactory, UiState, ViewState } from '..'
import { UiStateMono, UiStateSplit } from '../model-ui-state'

const log = logFactory().getChildFactory('ViewState')

export function factoryViewState(
    view: string,
    uiState: UiState,
    additionalClasses: string,
): ViewState {
    return {
        isVisible: isVisible(view, uiState),
        display: getDisplay(view, uiState),
        classes: getClasses(view, uiState, additionalClasses),
    }
}

function getDisplay(view: string, uiState: UiState) {
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
    log.getChildLogger('getDisplay')
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

function getClasses(
    view: string,
    uiState: UiState,
    additionalClass = '',
): string {
    let _never: never
    switch (uiState.kind) {
        case 'mono':
            return getClassesMono(view, uiState, additionalClass)
        case 'split':
            return getClassesSplit(view, uiState, additionalClass)
        default:
            _never = uiState
    }
}

const getClassesMono: (
    view: string,
    uiState: UiStateMono,
    additionalClass: string,
) => string = (view, uiState, additionalClass) => {
    const result =
        uiState.view === view
            ? `order-first h-100 ${additionalClass}`
            : 'd-none'
    log.getChildLogger('Mono')
        .getChildLogger(`[${view}]`)
        .debug("returning classes '{0}' for {1}", [v(result), v(view)])
    return result
}

const getClassesSplit: (
    view: string,
    uiState: UiStateSplit,
    additionalClass: string,
) => string = (view, uiState, additionalClass) => {
    let result
    if (uiState.topView === view) {
        result = `order-first h-50 ${additionalClass}`
    } else if (uiState.bottomView === view) {
        result = `order-last h-50 ${additionalClass}`
    } else {
        result = 'd-none'
    }
    log.getChildLogger('Split')
        .getChildLogger(`[${view}]`)
        .debug("returning classes '{0}' for {1}", [v(result), v(view)])
    return result
}
