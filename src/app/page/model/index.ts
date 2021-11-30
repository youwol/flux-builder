/** @format */

import { logFactory as parentLogFactory } from '..'

export function logFactory() {
    return parentLogFactory().getChildFactory('Model')
}

export { Feature, rendersViewsNames, RenderViewName } from './model-features'

export { Conf } from './model-conf'
export { UiState, NumberPanes, RenderViewPosition } from './model-ui-state'
export { factoryConf } from './impl/model-conf'
