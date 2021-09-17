
import { merge } from 'rxjs';
import { ModuleFlux, Connection } from '@youwol/flux-core';
import { render, VirtualDOM } from '@youwol/flux-view'

import { AppObservables, AppStore } from './builder-state/index';
import { ModuleSettingsState, ModuleSettingsView } from './views/module-settings.view';
import { ConnectionSettingsState, ConnectionSettingsView } from './views/connection-settings.view';
import { Module } from 'node:module';


function moduleControls(mdle: ModuleFlux, appStore: AppStore): VirtualDOM {

    let state = new ModuleSettingsState(mdle, appStore)
    return new ModuleSettingsView(state)
}

function connectionControls(connection: Connection, appStore: AppStore): VirtualDOM {

    let state = new ConnectionSettingsState(connection, appStore)
    return new ConnectionSettingsView(state)
}

export function createAttributesPanel(appStore: AppStore, appObservables: AppObservables) {

    merge(appObservables.moduleSelected$, appObservables.connectionSelected$).subscribe(
        (d: ModuleFlux | Connection) => {
            
            let virtualDOM = {
                id: "attribute-panel",
                class: "panel-builder text-left w-100 h-100 position-relative d-flex flex-column fv-text-primary",
                style: { fontSize: "small", paddingTop: "0px" },
                children:[
                    d instanceof ModuleFlux 
                    ? moduleControls(d as ModuleFlux, appStore) 
                    : connectionControls(d as Connection, appStore)
                ] 
            }
            document.getElementById("panels-container-builder").innerHTML = ""
            let panelDiv = document.getElementById("panels-container-builder") as HTMLDivElement
            /*let virtualDOM = d.moduleId ?
                moduleControls(d as ModuleFlux, appStore) :
                connectionControls(d as Connection, appStore)*/
            panelDiv.appendChild(render(virtualDOM))
        }
    )
    appObservables.unselect$.subscribe((_) => {
        document.getElementById("panels-container-builder").innerHTML = ""
    })
}
