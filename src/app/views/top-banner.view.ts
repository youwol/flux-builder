import { ModuleFlux } from "@youwol/flux-core"
import { attr$, VirtualDOM } from "@youwol/flux-view"
import { BehaviorSubject, merge, Observable, of } from "rxjs"
import { map } from "rxjs/operators"
import { AppStore, UiState } from "../builder-editor/builder-state"

interface Action {

    name: string
    class: string
    visible: boolean | Observable<boolean>
    enabled: boolean | Observable<boolean>
    onTriggered: () => void
}
export function topBanner(appStore: AppStore): VirtualDOM {

    let actions = getActions(appStore)
    let view = {
        class: 'd-flex grapes-bg-color py-1  fv-color-primary justify-content-around',
        children: [
            groupActionsView(actions.main, appStore),
            groupActionsView(actions.layout, appStore),
            groupActionsView(actions.modules, appStore),
            groupActionsView(actions.groups, appStore),
        ]
    }
    return view
}

function getActions(appStore: AppStore) {

    let observables = appStore.appObservables
    return {
        main: [
            {
                name: "save",
                class: 'fas fa-save',
                visible: of(true),
                enabled: of(true),
                onTriggered: () => appStore.saveProject()
            },
            {
                name: "undo",
                class: 'fas fa-undo',
                visible: new BehaviorSubject(true),
                enabled: observables.projectUpdated$.pipe(
                    map(() => {
                        return appStore.indexHistory > 1
                    })
                ),
                onTriggered: () => appStore.undo()
            },
            {
                name: "redo",
                class: 'fas fa-redo',
                visible: new BehaviorSubject(true),
                enabled: observables.projectUpdated$.pipe(
                    map(() => {
                        return appStore.indexHistory < appStore.history.length - 1
                    })
                ),
                onTriggered: () => appStore.redo()
            }
        ],
        layout: [
            {
                name: "builder-view",
                class: 'fas fa-project-diagram',
                visible: of(true),
                enabled: observables.uiStateUpdated$.pipe(
                    map( (uiState:UiState) => uiState.mode == "render" ||  uiState.mode == "combined")
                ),
                onTriggered: () => appStore.setUiState(new UiState("builder", false, false))
            },
            {
                name: "render-view",
                class: 'fas fa-eye',
                visible: of(true),
                enabled: observables.uiStateUpdated$.pipe(
                    map( (uiState:UiState) => uiState.mode == "builder" ||  uiState.mode == "combined")
                ),
                onTriggered: () => appStore.setUiState(new UiState("render", false, false))
            },
            {
                name: "builder-view",
                class: 'fas fa-columns fa-rotate-90',
                visible: of(true),
                enabled: observables.uiStateUpdated$.pipe(
                    map( (uiState:UiState) => uiState.mode == "render" ||  uiState.mode == "builder")
                ),
                onTriggered: () => appStore.setUiState(new UiState("combined", false, false))
            },
            {
                name: "builder-view",
                class: 'fas fa-expand  ',
                visible: of(true),
                enabled: of(true),
                onTriggered: () => document.documentElement.requestFullscreen()
            }
        ],
        modules: [
            {
                name: 'duplicate',
                class: "fas fa-clone",
                visible: of(true),
                enabled: merge(observables.unselect$, observables.moduleSelected$).pipe(
                    map(selected => selected instanceof ModuleFlux)
                ),
                onTriggered: () => {
                    let mdles = appStore.getModulesSelected()
                    appStore.duplicateModules(mdles)
                }
            },
            {
                name: 'horizontal align',
                class: "fas fa-ruler-vertical",
                visible: of(true),
                enabled: merge(observables.unselect$, observables.moduleSelected$).pipe(
                    map(selected => selected instanceof ModuleFlux)
                ),
                onTriggered: () => {
                    let mdles = appStore.getModulesSelected()
                    appStore.alignH(mdles)
                }
            },
            {
                name: 'horizontal align',
                class: "fas fa-ruler-horizontal",
                visible: of(true),
                enabled: merge(observables.unselect$, observables.moduleSelected$).pipe(
                    map(selected => selected instanceof ModuleFlux)
                ),
                onTriggered: () => {
                    let mdles = appStore.getModulesSelected()
                    appStore.alignV(mdles)
                }
            }/*
              {
                id: 'group-module',
                active: false, // active by default
                className: 'selection-actions',
                label: '<i id="toggle-render-view" class="fas fa-object-group panel-action" data-toggle="tooltip" title="group selected modules"></i>',
                command: 'group-module',
                toggable: false
              }*/
        ],
        groups: [
            {
                name: 'group',
                class: "fas fa-object-group",
                visible: of(true),
                enabled: merge(observables.unselect$, observables.moduleSelected$).pipe(
                    map(selected => selected instanceof ModuleFlux)
                ),
                onTriggered: () => {
                    appStore.addGroup(appStore.getModulesSelected().map(m => m.moduleId))
                }
            },
            {
                name: 'component',
                class: "fas fa-cube",
                visible: of(true),
                enabled: merge(observables.unselect$, observables.moduleSelected$).pipe(
                    map(selected => selected instanceof ModuleFlux)
                ),
                onTriggered: () => {
                    appStore.addComponent(appStore.getModulesSelected().map(m => m.moduleId))
                }
            }
        ]
    }
}

function actionView(action: Action): VirtualDOM {

    let visible$ = action.visible instanceof Observable
        ? action.visible
        : of(action.visible)
    let enabled$ = action.enabled instanceof Observable
        ? action.enabled
        : of(action.enabled)

    return {
        tag: 'button',
        type: 'button',
        disabled: attr$(enabled$, (enabled) => !enabled),
        class: attr$(
            visible$,
            (visible) => visible ? 'd-block' : 'd-none',
            {
                wrapper: (classes) => classes + " fv-btn fv-btn-secondary mx-1 fv-pointer"
            }
        ),
        style: attr$(enabled$, (enabled) => enabled ? { opacity: 1 } : { opacity: 0.5 }),
        children: [{
            tag: 'i',
            class: action.class + ""
        }],

        onclick: () => action.onTriggered()
    }
}

function groupActionsView(actions: Array<Action>, appStore: AppStore): VirtualDOM {

    return {
        class: 'd-flex ',
        children: actions.map(action => {
            return actionView(action)
        })
    }
}
