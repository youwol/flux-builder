/** @format */

import { Subscription } from 'rxjs'
import { logFactory, PresenterComponent } from '..'
import { Logger, v } from '../../../../externals_evolutions/logging'
import { ModelApp } from '../../model'
import { ImplPresenterDoc } from './presenter-doc'
import { factoryHierarchy, ImplPresenterModule } from './presenter-module'
import { PresenterTree } from './presenter-tree'

export class ImplPresenterComponent implements PresenterComponent {
    private readonly log: Logger
    public readonly css: ImplPresenterDoc<'css'>
    public readonly html: ImplPresenterDoc<'html'>
    public readonly presenterTree: PresenterTree

    private readonly subscriptions: Subscription[]
    public modules: ImplPresenterModule[]

    constructor(public readonly modelApp: ModelApp) {
        this.log = logFactory().getChildLogger('Component')
        this.log.debug('Constructor')
        this.css = new ImplPresenterDoc('css', this)
        this.html = new ImplPresenterDoc('html', this)
        this.presenterTree = new PresenterTree(this)
        this.subscriptions = this.subscribe()
    }

    private subscribe(): Subscription[] {
        this.log.debug('subscribe')
        const logActiveComponent = this.log.getChildLogger(
            'modelApp.activeComponent$',
        )
        const logModuleIdSelected = this.log.getChildLogger(
            'modelApp.moduleIdSelected$',
        )
        return [
            this.modelApp.activeComponent$.subscribe((modelComponent) => {
                const presenterComponent = factoryHierarchy(
                    modelComponent,
                    true,
                )
                logActiveComponent.debug(
                    'get component {0}',
                    v(presenterComponent.id),
                )
                this.modules = presenterComponent.descendantsHavingRenderView
                this.css.loadComponentContent(modelComponent)
                this.html.loadComponentContent(modelComponent)
                this.presenterTree.load(presenterComponent)

                const moduleIdSelected = this.modelApp.moduleIdSelected
                logActiveComponent.debug(
                    'selecting moduleId {0}',
                    v(moduleIdSelected),
                )
                this.select(moduleIdSelected)
            }),
            this.modelApp.moduleIdSelected$.subscribe((moduleIdSelected) => {
                logModuleIdSelected.debug(
                    'selecting moduleId {0}',
                    v(moduleIdSelected),
                )
                this.select(moduleIdSelected)
            }),
        ]
    }

    public unsubscribe(): void {
        this.log.debug('Unsubscribe')
        this.subscriptions.forEach((subscription) => subscription.unsubscribe())
        this.presenterTree.unsubscribe()
    }

    private select(moduleId: string) {
        this.log.debug('select {0}', v(moduleId))
        this.modules.forEach((mdle) => (mdle.selected = mdle.id === moduleId))
    }
}
