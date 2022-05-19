/** @format */

import { BehaviorSubject, merge } from 'rxjs'
import { Connection, ModuleFlux } from '@youwol/flux-core'
import { child$, VirtualDOM } from '@youwol/flux-view'
import { resizablePanel } from '@youwol/fv-group'
import { ProjectTreeView } from '../../page/views/project-tree.view'
import { AppStore } from '../builder-state'
import {
    ConnectionSettingsState,
    ConnectionSettingsView,
} from './connection-settings.view'
import { ModuleSettingsState, ModuleSettingsView } from './module-settings.view'
import appStoreAsProjectManager = ProjectTreeView.appStoreAsProjectManager
import ProjectManager = ProjectTreeView.ProjectManager

export function factoryFlowBuilderView(appStore: AppStore): VirtualDOM {
    const settingsPanelVisible$ = new BehaviorSubject(false)
    return {
        id: 'flow-builder_view',
        class: 'd-flex w-100',

        children: [
            resizablePanel(projectTreeView(appStore), 'Project Tree'),
            svgCanvasView(),
            resizablePanel(
                settingsView(appStore, settingsPanelVisible$),
                'Settings',
                'right',
                { visible$: settingsPanelVisible$, minWidth: 218 },
            ),
        ],
    }
}

function svgCanvasView() {
    return {
        id: 'wf-builder-view',
        class: 'h-100 flex-grow-1 flex-column d-flex',
    }
}

function settingsView(appStore: AppStore, visible$: BehaviorSubject<boolean>) {
    const appObservables = appStore.appObservables
    const settingsFactory = [
        {
            when: (d) => d instanceof ModuleFlux,
            mapTo: (m: ModuleFlux) => {
                const state = new ModuleSettingsState(m, appStore)
                return new ModuleSettingsView(state)
            },
        },
        {
            when: (d) => d instanceof Connection,
            mapTo: (c: Connection) => {
                const state = new ConnectionSettingsState(c, appStore)
                return new ConnectionSettingsView(state)
            },
        },
    ]

    return {
        id: 'panel__right_builder',
        class: 'd-flex flex-column p-1 text-left fv-text-primary',
        style: {
            width: '300px',
            minHeight: '0px',
            fontSize: 'small',
        },
        children: [
            child$(
                merge(
                    appObservables.unselect$,
                    appObservables.moduleSelected$,
                    appObservables.connectionSelected$,
                ),
                (selection: ModuleFlux | Connection) => {
                    const factory = settingsFactory.find((f) =>
                        f.when(selection),
                    )
                    if (!factory) {
                        visible$.next(false)
                        return {}
                    }
                    visible$.next(true)
                    return factory.mapTo(selection as any)
                },
            ),
        ],
    }
}

function projectTreeView(appStore: AppStore) {
    const panelId = 'panel__left_builder'
    const projectManager: ProjectManager = appStoreAsProjectManager(appStore)
    const state = ProjectTreeView.State.stateForProjectManagerAndUniq(
        projectManager,
        panelId,
    )
    return {
        id: panelId,
        class:
            'd-flex w-100 flex-column p-1 border border-dark text-left' +
            ' fv-text-primary',
        style: {
            minHeight: '0px',
            fontSize: 'small',
        },
        children: [new ProjectTreeView.View({ state: state })],
    }
}
