/** @format */

import { ImmutableTree } from '@youwol/fv-tree/src/index'
import { Factory } from '../../externals_evolutions/logging/factory'
import { ContractPresenterModuleHierarchy } from './presenter-module-hierarchy'

export * from './presenter'
export * from './presenter-doc'
export * from './presenter-module-hierarchy'
export * from './presenter-module-position'
export * from './position'
export type ContractPresenterTree =
    ImmutableTree.State<ContractPresenterModuleHierarchy>

export { factoryPresenter } from './impl/factory'

export function logFactory() {
    return new Factory('/layout-editor').getChildFactory('Presenter')
}
