
import { merge } from 'rxjs';
import { ModuleFlux, Connection } from '@youwol/flux-core';
import { render, VirtualDOM } from '@youwol/flux-view'

import { AppObservables, AppStore } from './builder-state/index';
import { ModuleSettingsState, ModuleSettingsView } from './views/module-settings.view';
import { ConnectionSettingsState, ConnectionSettingsView } from './views/connection-settings.view';


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
        (d: any) => {

            document.getElementById("attributes-panel").innerHTML = ""
            let panelDiv = document.getElementById("attributes-panel") as HTMLDivElement
            let virtualDOM = d.moduleId ?
                moduleControls(d as ModuleFlux, appStore) :
                connectionControls(d as Connection, appStore)
            panelDiv.appendChild(render(virtualDOM))
        }
    )
    appObservables.unselect$.subscribe((_) => {
        document.getElementById("attributes-panel").innerHTML = ""
    })
}
