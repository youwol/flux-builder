/** @format */

import { Component } from '@youwol/flux-core'
import { combineLatest, Observable } from 'rxjs'
import { distinctUntilChanged, map, tap } from 'rxjs/operators'
import { logFactory, ModelApp, ModelComponent } from '..'
import { AppStore } from '../../../builder-editor/builder-state'
import { navigate } from '../../../externals_evolutions/core/navigation'
import { v } from '../../../externals_evolutions/logging'
import { ImplModelComponent } from './model-component'

const log = logFactory().getChildLogger('App')

export class ImplModelApp implements ModelApp {
    private readonly log
    readonly activeComponent$: Observable<ModelComponent>
    readonly moduleIdSelected$: Observable<string>

    public get moduleIdSelected(): string {
        const selectedModuleId = this.appStore.getModuleSelected()?.moduleId
        log.debug('Returning Selected ModuleId : {0}', v(selectedModuleId))
        return selectedModuleId
    }

    public set moduleIdSelected(moduleId: string) {
        this.log.debug('Check if {0} not already selected', v(moduleId))
        if (this.appStore.getModuleSelected()?.moduleId !== moduleId) {
            this.log.debug('Selecting {0}', v(moduleId))
            this.appStore.selectModule(moduleId, true)
        }
    }

    constructor(private readonly appStore: AppStore) {
        this.log = log
        this.log.debug('Constructor')
        this.activeComponent$ = this.getObservableActiveComponent$()
        this.moduleIdSelected$ = this.getObservableModuleIdSelected()
    }

    private getObservableActiveComponent$() {
        const _log = this.log.getChildLogger('PipingActiveLayerUpdated')
        return combineLatest([
            this.appStore.appObservables.projectUpdated$,
            this.appStore.appObservables.activeLayerUpdated$,
        ]).pipe(
            tap(([_, { toLayerId }]) =>
                _log.debug('Receive layerId {0}', v(toLayerId)),
            ),
            distinctUntilChanged(
                (
                    [xWorkflowUpdate, xLayerUpdate],
                    [yWorkflowUpdate, yLayerUpdate],
                ) => {
                    const t = xWorkflowUpdate === yWorkflowUpdate
                    return (
                        t && xLayerUpdate.toLayerId === yLayerUpdate.toLayerId
                    )
                },
            ),
            tap(([_, { toLayerId }]) =>
                _log.debug('new layerId {0}', v(toLayerId)),
            ),
            map(([workUpdate, { toLayerId }]) => ({
                workflowUpdate: workUpdate,
                componentId: navigate(this.appStore.project.workflow)
                    .fromGroup(toLayerId)
                    .ifNoMatch(
                        (mdle) => mdle instanceof Component.Module,
                        (nav) => nav.toParentComponent(),
                    ).moduleId,
            })),
            tap(({ componentId }) =>
                _log.debug('layerId matched to component {0}', v(componentId)),
            ),
            distinctUntilChanged(
                (
                    {
                        workflowUpdate: xWorkflowUpdate,
                        componentId: xComponentId,
                    },
                    {
                        workflowUpdate: yWorkflowUpdate,
                        componentId: yComponentId,
                    },
                ) => {
                    const t = xWorkflowUpdate === yWorkflowUpdate
                    return t && xComponentId === yComponentId
                },
            ),
            tap(({ componentId }) =>
                _log.debug('new component {0}', v(componentId)),
            ),
            map(
                ({ componentId }) =>
                    new ImplModelComponent(
                        navigate(this.appStore.project.workflow)
                            .fromComponent(componentId)
                            .get(),
                        this.appStore,
                    ),
            ),
        )
    }

    private getObservableModuleIdSelected() {
        const _log = this.log.getChildLogger('PipingModuleIdSelected')
        return this.appStore.appObservables.moduleSelected$.pipe(
            map((mdle) => mdle.moduleId),
            tap((moduleId) => _log.debug('Receive module Id {0}', v(moduleId))),
            distinctUntilChanged(),
            tap((moduleId) => _log.debug('new module Id {0}', v(moduleId))),
        )
    }
}
