/** @format */

import { logFactory as parentLogFactory } from '..'

export function logFactory() {
    return parentLogFactory().getChildFactory('Model')
}

export { RenderViewPosition, RenderViewName, Features } from './model-common'

export { ViewState } from './model-view-state'
export { Conf } from './model-conf'
export { UiState } from './model-ui-state'
export { factoryViewState } from './impl/model-view-state'
export { factoryConf } from './impl/model-conf'
