/** @format */

import {
    Component,
    GroupModules,
    ModuleFlux,
    PluginFlux,
} from '@youwol/flux-core'
import { logFactory, ModelModule, TypeModule } from '..'
import { AppStore } from '../../../builder-editor/builder-state'
import { navigate } from '../../../externals_evolutions/core/navigation'

const log = logFactory().getChildLogger('Module')

const hasRenderView = (mdle: ModuleFlux): boolean =>
    mdle.Factory.RenderView !== undefined

export class ImplModelModule implements ModelModule {
    private readonly log
    hasRenderView: boolean
    id: string
    type: TypeModule

    constructor(
        private readonly mdle: ModuleFlux,
        protected readonly appStore: AppStore,
        root = false,
    ) {
        this.log = log.getChildLogger(`[${mdle.moduleId}]`)
        this.log.debug('Constructor')
        this.id = mdle.moduleId
        this.hasRenderView = hasRenderView(mdle)
        this.type = root ? 'root' : getModuleType(mdle)
    }

    public get title(): string {
        return this.id === Component.rootComponentId
            ? this.appStore.project.name
            : this.mdle.configuration.title
    }

    select(): void {
        this.appStore.selectModule(this.mdle.moduleId, true)
    }

    public get childrenContainingRendersView(): ModelModule[] {
        if (this.type === 'component') {
            this.log.debug('Not returning renders for component')
            return
        }
        const children = [
            ...navigate(this.appStore.project.workflow)
                .from(this.mdle.moduleId)
                .toChildren()
                .filter(
                    (nav) =>
                        hasRenderView(nav.get()) &&
                        !(nav.get() instanceof Component.Module),
                ),
            ...navigate(this.appStore.project.workflow)
                .from(this.mdle.moduleId)
                .toChildren()
                .filter(
                    (navChild) =>
                        navChild.toDescendantsMatching(
                            hasRenderView,
                            (navDescendant) =>
                                !(navDescendant instanceof Component.Module),
                        ).length != 0,
                ),
        ]
        return children.length != 0
            ? children.map(
                (navChild) =>
                    new ImplModelModule(navChild.get(), this.appStore),
            )
            : undefined
    }
}

function getModuleType(mdle: ModuleFlux): TypeModule {
    if (mdle instanceof Component.Module) {
        return 'component'
    } else if (mdle instanceof GroupModules.Module) {
        return 'group'
    } else if (mdle instanceof PluginFlux) {
        return 'plugin'
    } else if (mdle instanceof ModuleFlux) {
        return 'module'
    } else {
        throw new Error('Module is not instance of a known class')
    }
}
