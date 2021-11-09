/** @format */

import { ImmutableTree } from '@youwol/fv-tree'
import { Subscription } from 'rxjs'
import { filter, map } from 'rxjs/operators'
import { logFactory, PresenterTreeNode } from '..'
import { selectNodeAndExpand } from '../../../externals_evolutions/fv-tree/immutable-tree'
import { Logger, v } from '../../../externals_evolutions/logging'
import { ImplPresenterComponent } from './presenter-component'
import { ImplPresenterModule } from './presenter-module'

export class PresenterTree extends ImmutableTree.State<PresenterTreeNode> {
    private readonly log: Logger
    private rootId: string
    private readonly _subscriptions: Subscription[] = []
    constructor(private readonly presenter: ImplPresenterComponent) {
        super({
            rootNode: new ImplPresenterModule(
                {
                    id: '',
                    type: 'root',
                    childrenContainingRendersView: [],
                    title: 'loading …',
                    select: () => {
                        /* NOOP */
                    },
                    hasRenderView: false,
                },
                undefined,
                true,
            ),
        })
        this.rootId = ''
        this.log = logFactory().getChildLogger('PresenterTree')
        this.log.debug('Constructor')
        const logSelectedNode = this.log.getChildLogger('self.selectedNode$')
        const logModuleIdSelected = this.log.getChildLogger(
            'modelApp.moduleIdSelected$',
        )
        this._subscriptions.push(
            this.selectedNode$
                .pipe(
                    filter((mdle) => mdle && mdle.typeModule !== 'root'),
                    map((node) => node.id),
                )
                .subscribe((id) => {
                    logSelectedNode.debug('Node selected: {0}', v(id))
                    this.presenter.modelApp.moduleIdSelected = id
                }),
            this.presenter.modelApp.moduleIdSelected$.subscribe((id) => {
                logModuleIdSelected.debug('moduleId selected {0}', v(id))
                this.maybeSelect(id)
            }),
        )
    }

    private maybeSelect(id: string) {
        if (this.getNode(id)) {
            this.log.debug('Selecting {0}', v(id))
            selectNodeAndExpand(this, this.getNode(id))
        } else {
            this.log.debug('Id {0} not found', v(id))
            selectNodeAndExpand(this, this.getNode(this.rootId))
        }
    }

    public load(root: ImplPresenterModule) {
        this.rootId = root.id
        this.reset(root, true)
        this.maybeSelect(this.presenter.modelApp.moduleIdSelected)
    }

    public unsubscribe() {
        super.unsubscribe()
        this._subscriptions.forEach((subscription) =>
            subscription.unsubscribe(),
        )
    }
}
