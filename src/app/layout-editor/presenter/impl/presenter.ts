/** @format */

import { Subscription } from 'rxjs'
import { ContractPresenter } from '../'
import { ContractModel } from '../../model'
import { PresenterDoc } from './presenter-doc'
import { factoryHierarchy, PresenterModule } from './presenter-module'
import { PresenterTree } from './presenter-tree'

export class Presenter implements ContractPresenter {
    private readonly subscriptions: Subscription[]

    modules: PresenterModule[]

    public readonly css: PresenterDoc<'css'>
    public readonly html: PresenterDoc<'html'>
    public readonly presenterTree: PresenterTree

    public get selectedModuleId(): string {
        return this.model.selectedModuleId
    }

    public set selectedModuleId(moduleId: string) {
        this.model.selectedModuleId = moduleId
    }

    constructor(public readonly model: ContractModel) {
        this.css = new PresenterDoc('css', this)
        this.html = new PresenterDoc('html', this)
        this.subscriptions = this.subscribe()
        this.presenterTree = new PresenterTree(this)
    }

    private subscribe(): Subscription[] {
        return [
            this.model.activeComponent$.subscribe((modelComponent) => {
                const presenterComponent = factoryHierarchy(
                    modelComponent,
                    true,
                )
                this.modules = presenterComponent.descendantsHavingRenderView
                this.css.loadComponentContent(modelComponent)
                this.html.loadComponentContent(modelComponent)
                this.presenterTree.load(presenterComponent)
                this.onSelection(this.model.selectedModuleId)
            }),
            this.model.moduleIdSelected$.subscribe((moduleId) =>
                this.onSelection(moduleId),
            ),
        ]
    }

    public unsubscribe(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe())
        this.presenterTree.unsubscribe()
    }

    private onSelection(moduleId: string) {
        this.modules.forEach((mdle) => (mdle.selected = mdle.id === moduleId))
    }
}
