/** @format */

import { combineLatest } from 'rxjs'
import { attr$, child$, VirtualDOM } from '@youwol/flux-view'
import { ImmutableTree } from '@youwol/fv-tree'
import {
    PositionInDoc,
    PresenterComponent,
    PresenterDoc,
    PresenterTree,
    PresenterTreeNode,
} from '../presenter'
import { logFactory } from '.'
import { IconForTypeModule } from './icon-for-type-module.view'

const log = logFactory().getChildLogger('ViewTree')

export function projectTreeView(
    presenterComponent: PresenterComponent,
): VirtualDOM {
    const panelId = 'panel__left_builder'
    log.debug('factory')
    return {
        id: panelId,
        class: 'd-flex p-1',
        style: {
            width: '300px',
            minHeight: '0px',
            fontSize: 'small',
        },
        children: [
            new ProjectTreeView({
                presenterComponent,
            }),
        ],
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
function getNodeHeaderView(
    presenterDocCss: PresenterDoc,
    presenterDocHtml: PresenterDoc,
) {
    return (state: PresenterTree, node: PresenterTreeNode): VirtualDOM => {
        // Classes for the vDOM
        const vDomClasses =
            'project-tree-node d-flex fv-pointer align-items-center'

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
                child$(
                    node.textualRepresentation$,
                    (textualRepresentation) => ({
                        class: attr$(
                            combineLatest([
                                node.positionIn.html$,
                                node.selected$,
                            ]),
                            ([pos, selected]) =>
                                pos.typeInDoc === 'ignore' && !selected
                                    ? ' fv-text-disabled'
                                    : '',
                        ),
                        innerText: textualRepresentation,
                    }),
                ),
                {
                    class: attr$(
                        combineLatest([node.selected$, node.positionIn.html$]),
                        classesFromPosition('fa-html5'),
                    ),
                    onclick: attr$(
                        combineLatest([node.selected$, node.positionIn.html$]),
                        onClickHandler(node, presenterDocHtml),
                    ),
                },
                {
                    class: attr$(
                        combineLatest([node.selected$, node.positionIn.css$]),
                        classesFromPosition('fa-css3'),
                    ),
                    onclick: attr$(
                        combineLatest([node.selected$, node.positionIn.css$]),
                        onClickHandler(node, presenterDocCss),
                    ),
                },
            ],
        }
    }
}

const onClickHandler =
    (node: PresenterTreeNode, presenterDoc: PresenterDoc) =>
    ([selected, position]: [boolean, PositionInDoc]):
        | ((event: MouseEvent) => void)
        | undefined => {
        const _log = log.getChildLogger('onClickHandler')
        if (selected && position.typeInDoc === 'missing') {
            return (event) => {
                _log.debug('inserting and stopping click propagation')
                presenterDoc.insert()
                presenterDoc.showSelectedModule()
                event.stopPropagation()
            }
        } else if (position.typeInDoc === 'present') {
            return () => {
                _log.debug('showing selected module')
                presenterDoc.showModule(node.id)
            }
        } else {
            return () => {
                _log.debug('ignoring click')
            }
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
                return selected
                    ? format('fv-text-success fv-hover-x-lighter')
                    : ''
            case 'present':
                return format('fv-text-secondary fv-hover-x-lighter')
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

    constructor({
        presenterComponent,
        ...others
    }: {
        presenterComponent: PresenterComponent
    }) {
        super({
            state: presenterComponent.presenterTree,
            headerView: getNodeHeaderView(
                presenterComponent.css,
                presenterComponent.html,
            ),
            ...others,
        })
    }
}
