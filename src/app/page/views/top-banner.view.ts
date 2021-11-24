/** @format */

import { BehaviorSubject, merge, Observable, of } from 'rxjs'
import { map } from 'rxjs/operators'
import { ModuleFlux } from '@youwol/flux-core'
import { attr$, VirtualDOM } from '@youwol/flux-view'
import { v } from '../../externals_evolutions/logging'
import { AppStore } from '../../builder-editor/builder-state'
import { PresenterUiState } from '../presenter'
import { logFactory } from '..'

const log = logFactory().getChildLogger('TopBannerView')

interface Action {
    name: string
    class: string
    visible: boolean | Observable<boolean>
    enabled: boolean | Observable<boolean>
    onTriggered: () => void
}
export function topBanner(
    appStore: AppStore,
    uiStatePresenter: PresenterUiState,
): VirtualDOM {
    const actions = getActions(appStore, uiStatePresenter)
    return {
        class: 'd-flex w-100 justify-content-around',
        children: [
            groupActionsView(actions.features),
            groupActionsView(actions.main),
            groupActionsView(actions.layout),
            groupActionsView(actions.modules),
            groupActionsView(actions.groups),
        ],
    }
}

function getActions(appStore: AppStore, presenter: PresenterUiState) {
    const observables = appStore.appObservables
    return {
        features: [
            {
                name: 'main',
                class: 'fas fa-code',
                visible: of(true),
                enabled: of(true),
                onTriggered: () => {
                    if (
                        confirm(
                            'This page will be redirected. All unsaved changes will be lost.\n' +
                                'Do you confirm  ?',
                        )
                    ) {
                        const href = presenter.alternateUrl
                        log.debug('Redirecting from "{0}" to "{1}"', [
                            v(document.location.href),
                            v(href),
                        ])
                        document.location.href = `?${href}`
                    }
                },
            },
        ],
        main: [
            {
                name: 'save',
                class: 'fas fa-save',
                visible: of(true),
                enabled: of(true),
                onTriggered: () => appStore.saveProject(),
            },
            {
                name: 'undo',
                class: 'fas fa-undo',
                visible: new BehaviorSubject(true),
                enabled: observables.projectUpdated$.pipe(
                    map(() => {
                        return appStore.indexHistory > 1
                    }),
                ),
                onTriggered: () => appStore.undo(),
            },
            {
                name: 'redo',
                class: 'fas fa-redo',
                visible: new BehaviorSubject(true),
                enabled: observables.projectUpdated$.pipe(
                    map(() => {
                        return (
                            appStore.indexHistory < appStore.history.length - 1
                        )
                    }),
                ),
                onTriggered: () => appStore.redo(),
            },
        ],
        layout: [
            {
                name: 'two-panes',
                class: 'fas fa-columns fa-rotate-90 n-resize',
                visible: of(true),
                enabled: presenter.uiState$.pipe(
                    map((uiState) => uiState.numberPanes !== 2),
                ),
                onTriggered: () => presenter.setNumberPanes(2),
            },
            {
                name: 'three-panes',
                class: 'fas fa-bars n-resize',
                visible: of(presenter.availableRendersViews.length > 2),
                enabled: presenter.uiState$.pipe(
                    map((uiState) => uiState.numberPanes !== 3),
                ),
                onTriggered: () => presenter.setNumberPanes(3),
            },
            {
                name: 'builder-view',
                class: 'fas fa-expand  ',
                visible: of(true),
                enabled: of(true),
                onTriggered: () => document.documentElement.requestFullscreen(),
            },
        ],
        modules: [
            {
                name: 'duplicate',
                class: 'fas fa-clone',
                visible: of(true),
                enabled: merge(
                    observables.unselect$,
                    observables.moduleSelected$,
                ).pipe(map((selected) => selected instanceof ModuleFlux)),
                onTriggered: () => {
                    const modules = appStore.getModulesSelected()
                    appStore.duplicateModules(modules)
                },
            },
            {
                name: 'horizontal align',
                class: 'fas fa-ruler-vertical',
                visible: of(true),
                enabled: merge(
                    observables.unselect$,
                    observables.moduleSelected$,
                ).pipe(map((selected) => selected instanceof ModuleFlux)),
                onTriggered: () => {
                    const modules = appStore.getModulesSelected()
                    appStore.alignH(modules)
                },
            },
            {
                name: 'horizontal align',
                class: 'fas fa-ruler-horizontal',
                visible: of(true),
                enabled: merge(
                    observables.unselect$,
                    observables.moduleSelected$,
                ).pipe(map((selected) => selected instanceof ModuleFlux)),
                onTriggered: () => {
                    const modules = appStore.getModulesSelected()
                    appStore.alignV(modules)
                },
            } /*
              {
                id: 'group-module',
                active: false, // active by default
                className: 'selection-actions',
                label: '<i id="toggle-render-view" class="fas fa-object-group panel-action" data-toggle="tooltip" title="group selected modules"></i>',
                command: 'group-module',
                toggable: false
              }*/,
        ],
        groups: [
            {
                name: 'group',
                class: 'fas fa-object-group',
                visible: of(true),
                enabled: merge(
                    observables.unselect$,
                    observables.moduleSelected$,
                ).pipe(map((selected) => selected instanceof ModuleFlux)),
                onTriggered: () => {
                    appStore.addGroup(
                        appStore.getModulesSelected().map((m) => m.moduleId),
                    )
                },
            },
            {
                name: 'component',
                class: 'fas fa-cube',
                visible: of(true),
                enabled: merge(
                    observables.unselect$,
                    observables.moduleSelected$,
                ).pipe(map((selected) => selected instanceof ModuleFlux)),
                onTriggered: () => {
                    appStore.addComponent(
                        appStore.getModulesSelected().map((m) => m.moduleId),
                    )
                },
            },
        ],
    }
}

function actionView(action: Action): VirtualDOM {
    const visible$ =
        action.visible instanceof Observable
            ? action.visible
            : of(action.visible)
    const enabled$ =
        action.enabled instanceof Observable
            ? action.enabled
            : of(action.enabled)

    return {
        tag: 'button',
        type: 'button',
        disabled: attr$(enabled$, (enabled) => !enabled),
        class: attr$(visible$, (visible) => (visible ? 'd-block' : 'd-none'), {
            wrapper: (classes) =>
                classes + ' fv-btn fv-btn-secondary mx-1 fv-pointer',
        }),
        style: attr$(enabled$, (enabled) =>
            enabled ? { opacity: 1 } : { opacity: 0.5 },
        ),
        children: [
            {
                tag: 'i',
                class: action.class + '',
            },
        ],

        onclick: () => action.onTriggered(),
    }
}

function groupActionsView(actions: Array<Action>): VirtualDOM {
    return {
        class: 'd-flex ',
        children: actions.map((action) => {
            return actionView(action)
        }),
    }
}
