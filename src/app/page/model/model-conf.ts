/** @format */

import { RenderViewName } from './model-features'
import { UiState } from './model-ui-state'

export interface Conf {
    initUiState: UiState
    availableRendersViews: RenderViewName[]
    altUrlQueryParams: string
}
