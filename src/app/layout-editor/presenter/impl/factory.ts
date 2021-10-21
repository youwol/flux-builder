/** @format */

import { ContractPresenter } from '../'
import { AppStore } from '../../../builder-editor/builder-state'
import { factoryModel } from '../../model'
import { Presenter } from './presenter'

export const factoryPresenter = (appStore: AppStore): ContractPresenter =>
    new Presenter(factoryModel(appStore))
