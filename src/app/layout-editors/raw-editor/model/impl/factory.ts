/** @format */

import { ModelApp } from '..'
import { AppStore } from '../../../../builder-editor/builder-state'
import { ImplModelApp } from './model-app'

export const factoryModel = (appStore: AppStore): ModelApp =>
    new ImplModelApp(appStore)
