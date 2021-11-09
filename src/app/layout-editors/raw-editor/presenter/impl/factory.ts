/** @format */

import { PresenterComponent } from '..'
import { AppStore } from '../../../../builder-editor/builder-state'
import { factoryModel } from '../../model'
import { ImplPresenterComponent } from './presenter-component'

export const factoryPresenter = (appStore: AppStore): PresenterComponent =>
    new ImplPresenterComponent(factoryModel(appStore))
