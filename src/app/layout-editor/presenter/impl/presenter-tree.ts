/** @format */

import { ImmutableTree } from '@youwol/fv-tree'
import { Subscription } from 'rxjs'
import { filter, map } from 'rxjs/operators'
import { selectNodeAndExpand } from '../../../externals_evolutions/fv-tree/immutable-tree'
import { v } from '../../../externals_evolutions/logging'
import { logFactory } from '../index'
import { ContractPresenterModuleHierarchy } from '../presenter-module-hierarchy'
import { Presenter } from './presenter'
import { PresenterModule } from './presenter-module'

const log = logFactory().getChildFactory('PresenterTree')

export class PresenterTree extends ImmutableTree.State<ContractPresenterModuleHierarchy> {
    private readonly log
    private rootId: string
    private readonly _subscriptions: Subscription[] = []
    constructor(private readonly presenter: Presenter) {
        super({
            rootNode: new PresenterModule(
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
        this.log = log.getChildLogger('[]')
        this.log.debug('Constructor')
        this._subscriptions.push(
            this.selectedNode$
                .pipe(
                    filter((mdle) => mdle && mdle.typeModule !== 'root'),
                    map((node) => node.id),
                )
                .subscribe((id) => {
                    this.log.debug('Node selected: {0}', v(id))
                    this.presenter.selectedModuleId = id
                }),
            this.presenter.model.moduleIdSelected$.subscribe((id) =>
                this.maybeSelect(id),
            ),
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

    public load(root: PresenterModule) {
        this.rootId = root.id
        this.reset(root, true)
        this.maybeSelect(this.presenter.selectedModuleId)
    }

    public unsubscribe() {
        super.unsubscribe()
        this._subscriptions.forEach((subscription) =>
            subscription.unsubscribe(),
        )
    }
}
