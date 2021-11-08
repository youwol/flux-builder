/** @format */

import { RenderViewName } from './model-common'
import { UiState } from './model-ui-state'

export interface Conf {
    initState: UiState
    defaultMono: UiState
    defaultSplit: UiState
    defaultBottom: RenderViewName
}
