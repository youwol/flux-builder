/** @format */

import { AppStore } from '../../../../builder-editor/builder-state'
import { ModelApp } from '..'
import { ImplModelApp } from './model-app'

export const factoryModel = (appStore: AppStore): ModelApp =>
    new ImplModelApp(appStore)
