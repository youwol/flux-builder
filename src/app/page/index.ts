/** @format */

import { logFactory as parentLogFactory } from '..'

export function logFactory() {
    return parentLogFactory().getChildFactory('UiState')
}

export { mainView } from './views'
export { factoryPresenterUiState, PresenterUiState } from './presenter'
export { ViewState } from './model'
