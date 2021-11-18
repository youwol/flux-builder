/** @format */

import { BehaviorSubject, merge, Observable, of } from 'rxjs'
import { map } from 'rxjs/operators'
import { ModuleFlux } from '@youwol/flux-core'
import { attr$, VirtualDOM } from '@youwol/flux-view'
import { v } from '../../externals_evolutions/logging'
import { AppStore } from '../../builder-editor/builder-state'
import { logFactory } from '..'
import { ViewState } from '../model'
import { PresenterUiState } from '../presenter'

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
        class: 'd-flex grapes-bg-color py-1  fv-color-primary justify-content-around',
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
                name: 'builder-view',
                class: 'fas fa-project-diagram n-resize',
                visible: of(true),
                enabled: presenter
                    .getPresenterViewState('flow-builder')
                    .state$.pipe(
                        map(
                            (viewState: ViewState) =>
                                viewState.display !== 'top' &&
                                viewState.display !== 'mono',
                        ),
                    ),
                onTriggered: () => presenter.toggleView('flow-builder'),
            },
            {
                name: 'grapejs-view',
                class: 'fas fa-palette n-resize',
                visible: of(presenter.hasFeature('grapejs-editor')),
                enabled: presenter
                    .getPresenterViewState('grapejs-editor')
                    .state$.pipe(
                        map(
                            (viewState: ViewState) =>
                                viewState.display !== 'top' &&
                                viewState.display !== 'mono',
                        ),
                    ),
                onTriggered: () => presenter.toggleView('grapejs-editor'),
            },
            {
                name: 'editor-view',
                class: 'fas fa-code n-resize',
                visible: of(presenter.hasFeature('raw-editor')),
                enabled: presenter
                    .getPresenterViewState('raw-editor')
                    .state$.pipe(
                        map(
                            (viewState: ViewState) =>
                                viewState.display !== 'top' &&
                                viewState.display !== 'mono',
                        ),
                    ),
                onTriggered: () => presenter.toggleView('raw-editor'),
            },
            {
                name: 'runner-view',
                class: 'fas fa-eye n-resize',
                visible: of(presenter.hasFeature('runner')),
                enabled: presenter
                    .getPresenterViewState('runner')
                    .state$.pipe(
                        map(
                            (viewState: ViewState) =>
                                viewState.display !== 'top' &&
                                viewState.display !== 'mono',
                        ),
                    ),
                onTriggered: () => presenter.toggleView('runner'),
            },
            {
                name: 'builder-view',
                class: 'fas fa-columns fa-rotate-90',
                visible: presenter.split$,
                enabled: of(true),
                onTriggered: () => presenter.toggleSplit(),
            },
            {
                name: 'builder-view',
                class: 'fas fa-project-diagram s-resize',
                visible: of(true),
                enabled: presenter
                    .getPresenterViewState('flow-builder')
                    .state$.pipe(
                        map(
                            (viewState: ViewState) =>
                                viewState.display !== 'bottom' &&
                                viewState.display !== 'mono',
                        ),
                    ),
                onTriggered: () =>
                    presenter.toggleView('flow-builder', 'bottom'),
            },
            {
                name: 'grapejs-view',
                class: 'fas fa-palette s-resize',
                visible: of(presenter.hasFeature('grapejs-editor')),
                enabled: presenter
                    .getPresenterViewState('grapejs-editor')
                    .state$.pipe(
                        map(
                            (viewState: ViewState) =>
                                viewState.display !== 'bottom' &&
                                viewState.display !== 'mono',
                        ),
                    ),
                onTriggered: () =>
                    presenter.toggleView('grapejs-editor', 'bottom'),
            },
            {
                name: 'editor-view',
                class: 'fas fa-code s-resize',
                visible: of(presenter.hasFeature('raw-editor')),
                enabled: presenter
                    .getPresenterViewState('raw-editor')
                    .state$.pipe(
                        map(
                            (viewState: ViewState) =>
                                viewState.display !== 'bottom' &&
                                viewState.display !== 'mono',
                        ),
                    ),
                onTriggered: () => presenter.toggleView('raw-editor', 'bottom'),
            },
            {
                name: 'runner-view',
                class: 'fas fa-eye s-resize',
                visible: of(presenter.hasFeature('runner')),
                enabled: presenter
                    .getPresenterViewState('runner')
                    .state$.pipe(
                        map(
                            (viewState: ViewState) =>
                                viewState.display !== 'bottom' &&
                                viewState.display !== 'mono',
                        ),
                    ),
                onTriggered: () => presenter.toggleView('runner', 'bottom'),
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
