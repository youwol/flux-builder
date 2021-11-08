/** @format */

import { PresenterUiState } from '../'
import { factoryConf } from '../../model'
import { getFeatures } from './presenter-conf'
import { ImplPresenterUiState } from './presenter-ui-state'

export function factoryPresenterUiState(): PresenterUiState {
    return new ImplPresenterUiState(factoryConf(getFeatures()))
}
