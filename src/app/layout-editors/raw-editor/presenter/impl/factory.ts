/** @format */

import { AppStore } from '../../../../builder-editor/builder-state'
import { factoryModel } from '../../model'
import { PresenterComponent } from '..'
import { ImplPresenterComponent } from './presenter-component'

export const factoryPresenter = (appStore: AppStore): PresenterComponent =>
    new ImplPresenterComponent(factoryModel(appStore))
