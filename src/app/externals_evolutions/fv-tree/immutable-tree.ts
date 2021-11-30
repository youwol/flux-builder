/** @format */

import { Component, ModuleFlux } from '@youwol/flux-core'

/**
 * Functions returning the id of a {@link ModuleNode|node} representing a {@link ModuleFlux|module}; this string
 * shall contains the module id for convenient debugging.
 *
 * Shall be instantiate with {@link nodeIdBuilderForUniq}.
 *
 * @category Nodes Id
 */
export interface NodeIdBuilder {
    /**
     * Return the id of the {@link ModuleNode|node} representing a {@link ModuleFlux|module}.
     *
     * @param mdle the module represented by the node
     */
    buildForModule: (mdle: ModuleFlux) => string
    /**
     * Return the id of the {@link ModuleNode|node} representing a {@link ModuleFlux|module}.
     *
     * @param moduleId the id of the module represented by the node
     */
    buildForModuleId: (moduleId: string) => string
    /**
     * Return the id of the {@link ModuleNode|Node} representing the root component
     *
     */
    buildForRootComponent: () => string
}

/**
 * Factory for {@link NodeIdBuilder}.
 *
 * Will return a collection of functions returning a unique, stable id based on a unique string and the id of a
 * {@link ModuleFlux|module}.
 *
 * @param uniq a (not empty, globally unique) string use to define {@link ModuleNode|nodes} ids
 *
 * @category Nodes Id
 *
 */
export function nodeIdBuilderForUniq(uniq: string): NodeIdBuilder {
    if (uniq === undefined || uniq === null || uniq.length == 0) {
        throw new Error('Unique string must be defined and not empty')
    }
    const nodeIdFromModuleId: (moduleId: string) => string = (moduleId) =>
        `project_tree_view-${uniq}-${moduleId}`
    return {
        buildForModule: (mdle) => nodeIdFromModuleId(mdle.moduleId),
        buildForModuleId: (moduleId) => nodeIdFromModuleId(moduleId),
        buildForRootComponent: () =>
            nodeIdFromModuleId(Component.rootComponentId),
    }
}
