import {Connection, ModuleFlux} from "@youwol/flux-core";
import {attr$, child$, VirtualDOM} from "@youwol/flux-view";
import {AppStore, UiState} from "../builder-state";
import {ConnectionSettingsState, ConnectionSettingsView} from "./connection-settings.view";
import {ModuleSettingsState, ModuleSettingsView} from "./module-settings.view";
import {merge} from "rxjs";
import {ProjectTreeView} from "../../views/project-tree.view";


export function builderView(appStore: AppStore) : VirtualDOM {

    let sizes = {
        'combined': 'h-50 d-flex',
        'builder': 'h-100 d-flex',
        'render': 'd-none'
    }
    return {
        id:'builder-component',
        class: attr$(
            appStore.appObservables.uiStateUpdated$,
            (uiState:UiState) => sizes[uiState.mode]
        ),

        children:[
            projectTreeView(appStore),
            svgCanvasView(),
            settingsView(appStore)
        ]
    }
}

function svgCanvasView(){
    return {
        id:"wf-builder-view",
        class:"h-100 flex-grow-1"
    }
}

function settingsView(appStore: AppStore){
    let appObservables = appStore.appObservables
    let settingsFactory = [
        {
            when: (d) => d instanceof ModuleFlux,
            mapTo: (m: ModuleFlux) =>{
                let state = new ModuleSettingsState(m, appStore)
                return new ModuleSettingsView(state)
            }
        },
        {
            when: (d) => d instanceof Connection,
            mapTo: (c: Connection) =>{
                let state = new ConnectionSettingsState(c, appStore)
                return new ConnectionSettingsView(state)
            }
        }
    ]

    return {
        id:"panel__right_builder",
        class: "d-flex flex-column grapes-bg-color fv-color-primary p-1 border border-dark text-left fv-text-primary",
        style: {
            width: '300px',
            minHeight:"0px",
            fontSize: "small"
        },
        children:[
            child$(
                merge(
                    appObservables.unselect$,
                    appObservables.moduleSelected$,
                    appObservables.connectionSelected$
                    ),
                (selection) => {
                    let factory = settingsFactory.find( f => f.when(selection))
                    if(!factory)
                        {return {}}
                    return factory.mapTo(selection)
                }
            )
        ]
    }
}

function projectTreeView(appStore: AppStore) {
    let panelId: string = "panel__left_builder"
    let state = ProjectTreeView.State.stateForAppStoreAndUniq(appStore, panelId)
   return {
        id:panelId,
        class: "d-flex flex-column grapes-bg-color fv-color-primary p-1 border border-dark text-left fv-text-primary",
        style: {
            width: '300px',
            minHeight: "0px",
            fontSize: "small"
        },
        children:[
            new ProjectTreeView.View({state: state})
        ]
    }
}
