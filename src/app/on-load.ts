/** @format */

import * as grapesjs from 'grapesjs'
import { merge } from 'rxjs'
import { take } from 'rxjs/operators'
import {
    ConfigurationStatus,
    Environment,
    ExpectationStatus,
    Journal,
    ModuleFlux,
} from '@youwol/flux-core'
import { createDrawingArea as createDrawingAreaSvg } from '@youwol/flux-svg-plots'
import { render, VirtualDOM } from '@youwol/flux-view'
import { ContextMenu } from '@youwol/fv-context-menu'
import {
    AssetsExplorerView,
    ConfigurationStatusView,
    ContextMenuState,
    ExpectationView,
} from './builder-editor/'
import { WorkflowPlotter } from './builder-editor/builder-plots/'

import {
    AppBuildViewObservables,
    AppDebugEnvironment,
    AppObservables,
    AppStore,
    LogLevel,
} from './builder-editor/builder-state/'
import { AssetsBrowserClient } from './clients/assets-browser.client'

import {
    createLayoutEditor,
    initLayoutEditor,
} from './layout-editors/grapesjs-editor/'
import { setDynamicComponentsBlocks } from './layout-editors/grapesjs-editor/flux-blocks'
import { logFactory } from '.'
import {
    autoAddElementInLayout,
    autoRemoveElementInLayout,
    removeTemplateElements,
    replaceTemplateElements,
    updateElementsInLayout,
} from './layout-editors/grapesjs-editor/flux-rendering-components'

import { plugNotifications } from './notification'
import { factoryPresenterUiState, mainView, PresenterUiState } from './page'
import { CdnMessageEvent, Client, LoadingScreenView } from '@youwol/cdn-client'

const log = logFactory().getChildLogger('on-load')

const defaultLog = false
const debugSingleton = AppDebugEnvironment.getInstance()

debugSingleton.workflowUIEnabled = defaultLog
debugSingleton.observableEnabled = defaultLog
debugSingleton.workflowUIEnabled = defaultLog
debugSingleton.workflowViewEnabled = defaultLog
debugSingleton.WorkflowBuilderEnabled = defaultLog
debugSingleton.renderTopicEnabled = defaultLog
debugSingleton.workflowView$Enabled = defaultLog

/**
 * This instance has been initialized in the main.ts file;
 * the loading screen is used here to display the '2nd' part of the loading process
 * (the dynamic dependencies of the flux-project)
 */
const loadingScreen: LoadingScreenView = Client['initialLoadingScreen']

const environment = new Environment({
    console /*: noConsole as Console*/,
    renderingWindow: undefined, // doc.defaultView,
    executingWindow: window,
})

debugSingleton.logWorkflowBuilder({
    level: LogLevel.Info,
    message: 'Environment instantiated',
    object: { environment },
})

const appStore = AppStore.getInstance(environment)

initializeAppStoreAssets(appStore)
const presenter = factoryPresenterUiState()
createMainView(appStore, presenter)

let layoutEditor
if (presenter.availableRendersViews.includes('grapejs-editor')) {
    layoutEditor = await createLayoutEditor()
    initializeGrapesAssets(layoutEditor)
}

const workflowPlotter = createDrawingArea(appStore, appStore.appObservables)
plugNotifications(appStore, workflowPlotter)

const contextState = new ContextMenuState(appStore, workflowPlotter.drawingArea)
new ContextMenu.View({ state: contextState, class: 'fv-bg-background' } as {
    state: ContextMenuState
})

if (presenter.availableRendersViews.includes('grapejs-editor')) {
    connectStreams(appStore, layoutEditor, presenter).then(() =>
        log.debug('ConnectStreams resolved'),
    )
} else {
    appStore.appObservables.packagesLoaded$.subscribe(() =>
        loadingScreen.done(),
    )
}

loadProject(appStore)

function loadProject(appStore: AppStore) {
    const projectId = new URLSearchParams(window.location.search).get('id')
    const uri = new URLSearchParams(window.location.search).get('uri')

    if (projectId) {
        appStore.environment.getProject(projectId).subscribe((project) => {
            loadingScreen.next(
                new CdnMessageEvent('project-loaded', 'Project loaded'),
            )
            appStore.loadProject(projectId, project, (event) => {
                loadingScreen.next(event)
            })
        })
    } else if (uri) {
        appStore.loadProjectURI(encodeURI(uri))
    }
}

function createMainView(
    appStore: AppStore,
    presenterUiState: PresenterUiState,
) {
    const mainLayout: VirtualDOM = mainView(appStore, presenterUiState)
    document.body.appendChild(render(mainLayout))
}

function initializeAppStoreAssets(appStore: AppStore) {
    AssetsBrowserClient.appStore = appStore
    // A single instance of assets browser to keep in memory expanded nodes etc
    AssetsExplorerView.singletonState = new AssetsExplorerView.State({
        appStore,
    })

    Journal.registerView({
        name: 'ConfigurationStatus',
        isCompatible: (data) => data instanceof ConfigurationStatus,
        view: (data: ConfigurationStatus<unknown>) =>
            render(ConfigurationStatusView.journalWidget(data)),
    })
    Journal.registerView({
        name: 'ExpectationStatus',
        isCompatible: (data) => data instanceof ExpectationStatus,
        view: (data: ExpectationStatus<unknown>) =>
            render(ExpectationView.journalWidget(data)),
    })
}

function initializeGrapesAssets(layoutEditor) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Why ??
    const writableEnv = environment as any
    writableEnv.renderingWindow = layoutEditor.Canvas.getDocument().defaultView
}

export async function connectStreams(
    appStore: AppStore,
    layoutEditor: grapesjs.Editor,
    presenterUiState: PresenterUiState,
) {
    let loading = true
    const appObservables = appStore.appObservables
    appObservables.packagesLoaded$.subscribe(() =>
        document.getElementById('loading-screen').remove(),
    )

    await appObservables.renderingLoaded$
        .pipe(take(1))
        .toPromise()
        .then(({ layout, style }) => {
            initLayoutEditor(layoutEditor, { layout, style }, appStore)
            replaceTemplateElements(
                appStore.getModulesAndPlugins().map((m) => m.moduleId),
                layoutEditor,
                appStore,
            )
        })

    appObservables.modulesUpdated$.subscribe(
        (diff: {
            createdElements: ModuleFlux[]
            removedElements: ModuleFlux[]
        }) => {
            const createdIds = diff.createdElements.map(
                (m: ModuleFlux) => m.moduleId,
            )

            const notReplaced = diff.removedElements.filter(
                (mdle) => !createdIds.includes(mdle.moduleId),
            )

            removeTemplateElements(notReplaced, layoutEditor)
            if (loading) {
                replaceTemplateElements(createdIds, layoutEditor, appStore)
            }
            if (!loading) {
                autoAddElementInLayout(diff, layoutEditor, appStore)
                updateElementsInLayout(diff, layoutEditor, appStore)
                autoRemoveElementInLayout(diff, layoutEditor, appStore)
            }

            setDynamicComponentsBlocks(appStore, layoutEditor)
        },
    )

    appObservables.activeLayerUpdated$.subscribe(() => {
        setDynamicComponentsBlocks(appStore, layoutEditor)
    })

    appObservables.unselect$.subscribe(() => {
        layoutEditor.Commands.stop('show-attributes')
    })

    merge(
        appObservables.moduleSelected$,
        appObservables.connectionSelected$,
    ).subscribe(() => {
        layoutEditor.Commands.run('show-attributes')
    })

    presenterUiState
        .getPresenterViewState('grapejs-editor')
        .state$.subscribe(() => {
            layoutEditor.refresh()
        })
    loading = false
}

export function createDrawingArea(
    appStore: AppStore,
    appObservables: AppObservables,
) {
    const plottersObservables = AppBuildViewObservables.getInstance()

    const width = 1000
    const height = 1000
    const drawingArea = createDrawingAreaSvg({
        containerDivId: 'wf-builder-view',
        width: width,
        height: height,
        xmin: -width / 2,
        ymin: -width / 2,
        xmax: width / 2,
        ymax: width / 2,
        margin: 50,
        overflowDisplay: { left: 1e8, right: 1e8, top: 1e8, bottom: 1e8 },
    })

    return new WorkflowPlotter(
        drawingArea,
        appObservables,
        plottersObservables,
        appStore,
    )
}
