/** @format */

import { ImmutableTree } from '@youwol/fv-tree/src/index'
import { logFactory as parentLogFactory } from '../index'
import { PresenterTreeNode } from './presenter-tree-node'

export function logFactory() {
    return parentLogFactory().getChildFactory('Presenter')
}

export { PresenterComponent } from './presenter-component'
export * from './presenter-doc'
export * from './presenter-tree-node'
export * from './presenter-module-position'
export * from './position'
export type PresenterTree = ImmutableTree.State<PresenterTreeNode>

export { factoryPresenter } from './impl/factory'
