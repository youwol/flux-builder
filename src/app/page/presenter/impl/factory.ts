/** @format */

import { factoryConf } from '../../model'
import { PresenterUiState } from '..'
import { ImplPresenterUiState } from './presenter-ui-state'

export function factoryPresenterUiState(): PresenterUiState {
    return new ImplPresenterUiState(factoryConf())
}
