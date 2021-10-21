/** @format */

import { AppStore } from '../../../builder-editor/builder-state'
import { ContractModel } from '../model'
import { Model } from './model'

export const factoryModel = (appStore: AppStore): ContractModel =>
    new Model(appStore)
