/** @format */

import { Feature, RenderViewName } from './model-features'
import { UiState } from './model-ui-state'

export interface Conf {
    initState: UiState
    defaultMono: UiState
    defaultSplit: UiState
    defaultBottom: RenderViewName
    features: Set<Feature>
    altUrlQueryParams: string
}
