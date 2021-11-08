/** @format */

import { logFactory as parentLogFactory } from '../'

export function logFactory() {
    return parentLogFactory().getChildFactory('Presenter')
}
export { PresenterUiState } from './presenter-ui-state'
export { PresenterViewState } from './presenter-view-state'
export { factoryPresenterUiState } from './impl/factory'
