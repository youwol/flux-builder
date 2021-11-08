/** @format */

import { attr$, child$, VirtualDOM } from '@youwol/flux-view'
import { ImmutableTree } from '@youwol/fv-tree'
import { combineLatest } from 'rxjs'
import { PositionInDoc, PresenterTree, PresenterTreeNode } from '../presenter'
import { logFactory } from './'
import { IconForTypeModule } from './icon-for-type-module.view'

const log = logFactory().getChildLogger('ViewTree')

export function projectTreeView(presenter: PresenterTree): VirtualDOM {
    const panelId = 'panel__left_builder'
    log.debug('factory')
    return {
        id: panelId,
        class: 'd-flex grapes-bg-color fv-color-primary p-1 border border-dark text-left fv-text-primary',
        style: {
            width: '300px',
            minHeight: '0px',
            fontSize: 'small',
        },
        children: [new ProjectTreeView({ state: presenter })],
    }
}

/**
 * {@link ModuleNode|Node} rendering.
 *
 * To be used by the {@link View|view}
 *
 * @category View
 *
 */
const nodeHeaderView = (
    state: PresenterTree,
    node: PresenterTreeNode,
): VirtualDOM => {
    // Classes for the vDOM
    const vDomClasses = 'project-tree-node d-flex fv-pointer align-items-center'

    // fontAwesome icon for this node
    return {
        class: vDomClasses,
        style: node.typeModule !== 'root' ? { fontSize: 'smaller' } : '',
        children: [
            {
                class: attr$(
                    node.positionIn.html$,
                    () => `mr-1 ${IconForTypeModule[node.typeModule]}`,
                ),
            },
            child$(node.textualRepresentation$, (textualRepresentation) => ({
                class: attr$(
                    combineLatest([node.positionIn.html$, node.selected$]),
                    ([pos, selected]) =>
                        pos.typeInDoc === 'ignore' && !selected
                            ? ' fv-text-disabled'
                            : '',
                ),
                innerText: textualRepresentation,
            })),
            {
                class: attr$(
                    combineLatest([node.selected$, node.positionIn.html$]),
                    classesFromPosition('fa-html5'),
                ),
            },
            {
                class: attr$(
                    combineLatest([node.selected$, node.positionIn.css$]),
                    classesFromPosition('fa-css3'),
                ),
            },
        ],
    }
}

const classesFromPosition =
    (iconClass: string) =>
    ([selected, position]: [boolean, PositionInDoc]) => {
        const format = (classColor) => `mx-1 fab ${iconClass} ${classColor}`
        let _exhaustSwitchCases: never
        switch (position.typeInDoc) {
            case 'ignore':
                return ''
            case 'missing':
                return selected ? format('fv-text-success') : ''
            case 'present':
                return format('fv-text-secondary')
            default:
                _exhaustSwitchCases = position
        }
    }

/**
 * The View
 * - Define how to render the tree, and use {@link nodeHeaderView} for rendering a {@link ModuleNode|node}
 * - declare callBack for disconnecting subscriptions of the {@link State|state} via {@link State.unsubscribe}
 *
 * @category View
 *
 */
export class ProjectTreeView extends ImmutableTree.View<PresenterTreeNode> {
    class = 'h-100'
    disconnectedCallback: (elem) => void

    constructor({ state, ...others }: { state: PresenterTree }) {
        super({
            state: state,
            headerView: nodeHeaderView,
            ...others,
        })
    }
}
