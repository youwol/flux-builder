
import { combineLatest, merge, ReplaySubject } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import * as grapesjs from 'grapesjs'

import { ModuleFlux, Environment, Journal, ConfigurationStatus, ExpectationStatus } from '@youwol/flux-core';
import { createDrawingArea as createDrawingAreaSvg} from '@youwol/flux-svg-plots';
import { ContextMenu } from '@youwol/fv-context-menu';

import { AppStore, AppObservables, UiState, AppDebugEnvironment, 
    LogLevel, AppBuildViewObservables } from './builder-editor/builder-state/index';
import { WorkflowPlotter } from './builder-editor/builder-plots/index';
import { ContextMenuState, ConfigurationStatusView, ExpectationView } from './builder-editor/index'

import { createLayoutEditor, initLayoutEditor } from './grapesjs-editor/index';

import { plugNotifications } from './notification';
import { AssetsBrowserClient } from './clients/assets-browser.client';
import { AssetsExplorerView } from './builder-editor/views/assets-explorer.view';
import { render, VirtualDOM } from '@youwol/flux-view';
import { loadingLibView, loadingProjectView } from './loading.views';
import { autoAddElementInLayout, autoRemoveElementInLayout, removeTemplateElements, 
    replaceTemplateElements, updateElementsInLayout } from './grapesjs-editor/flux-rendering-components';
import { setDynamicComponentsBlocks } from './grapesjs-editor/flux-blocks';
import { mainView } from './views/app.view';

let defaultLog      = false
let debugSingleton  = AppDebugEnvironment.getInstance()

debugSingleton.workflowUIEnabled       = defaultLog
debugSingleton.observableEnabled       = defaultLog
debugSingleton.workflowUIEnabled       = defaultLog
debugSingleton.workflowViewEnabled     = defaultLog
debugSingleton.WorkflowBuilderEnabled  = defaultLog
debugSingleton.renderTopicEnabled      = defaultLog
debugSingleton.workflowView$Enabled    = defaultLog
let noConsole = {
    log:(message?: any, ...optionalParams: any[])=> {},
    warn:(message?: any, ...optionalParams: any[])=> {},
    error:(message?: any, ...optionalParams: any[])=> {},
}

let environment = new Environment(
    {   console/*: noConsole as Console*/,
        renderingWindow: undefined, // doc.defaultView,
        executingWindow: window
    }
)

debugSingleton.logWorkflowBuilder( {  
  level : LogLevel.Info, 
  message: "Environment instantiated", 
  object:{ environment }
})

let appStore = AppStore.getInstance( environment )

initializeAppStoreAssets(appStore)

createMainView(appStore)

let layoutEditor = await createLayoutEditor() as any;
initializeGrapesAssets(layoutEditor);

let workflowPlotter = createDrawingArea(appStore, appStore.appObservables)
plugNotifications(appStore, workflowPlotter)

let contextState = new ContextMenuState( appStore, workflowPlotter.drawingArea )
new ContextMenu.View({state:contextState, class:"fv-bg-background"} as any)

connectStreams(appStore, layoutEditor )

loadProject(appStore)


function loadProject(appStore: AppStore){

    let projectId = new URLSearchParams(window.location.search).get("id")
    let uri = new URLSearchParams(window.location.search).get("uri")
    
    if(projectId){
        let loadingDiv = document.getElementById("content-loading-screen") as HTMLDivElement
        let divProjectLoading = loadingProjectView(loadingDiv)
        appStore.environment.getProject(projectId).subscribe( (project) => {
            divProjectLoading.innerText = `> project loaded` 
            divProjectLoading.style.setProperty("color", "green") 
            appStore.loadProject(projectId, project, (event) => {
                loadingLibView(event, loadingDiv)
            })
        })
    }
    else if(uri){
        appStore.loadProjectURI(encodeURI(uri))
    }
}

function createMainView(appStore: AppStore){
    let mainLayout : VirtualDOM = mainView(appStore)
    document.body.appendChild(render(mainLayout))    
}

function initializeAppStoreAssets(appStore: AppStore){

    AssetsBrowserClient.appStore = appStore
    // A single instance of assets browser to keep in memory expanded nodes etc
    AssetsExplorerView.singletonState = new AssetsExplorerView.State({
        appStore
    })

    Journal.registerView({
        name: "ConfigurationStatus",
        isCompatible:  (data) => 
            data instanceof ConfigurationStatus, 
        view: (data: ConfigurationStatus<unknown>) => 
            render(ConfigurationStatusView.journalWidget(data))
    })
    Journal.registerView({
        name: "ExpectationStatus",
        isCompatible:  (data) => 
            data instanceof ExpectationStatus, 
        view: (data: ExpectationStatus<unknown>) => 
            render(ExpectationView.journalWidget(data))
    })
}

function initializeGrapesAssets(layoutEditor: any){

    (environment as any).renderingWindow = layoutEditor.Canvas.getDocument().defaultView
}

function setUiState(state: UiState){   

    let renderNode  = document.getElementById("render-component")
    let builderNode = document.getElementById("builder-component")

    builderNode.classList.remove("combined","builder","render","none")
    renderNode.classList.remove("combined","builder","render","none")
    builderNode.classList.add(state.mode)
    renderNode.classList.add(state.mode)
}

export async function connectStreams(appStore:AppStore, layoutEditor: grapesjs.Editor ){

    let loading = true
    let appObservables = appStore.appObservables
    appObservables.packagesLoaded$.subscribe( ()=> document.getElementById("loading-screen").remove() )
    appObservables.uiStateUpdated$.subscribe( (state:UiState)=> setUiState(state) )

    await appObservables.renderingLoaded$
    .pipe(take(1))
    .toPromise()
    .then(({layout, style})=>  {
        initLayoutEditor(layoutEditor, {layout, style}, appStore) 
        replaceTemplateElements(appStore.getModulesAndPlugins().map( m => m.moduleId), layoutEditor, appStore)
    })
         
    appObservables.modulesUpdated$
    .subscribe((diff: any) => { 
        
        let createdIds = diff.createdElements.map( (m:ModuleFlux)=> m.moduleId)

        let notReplaced = diff.removedElements
        .filter( mdle => !createdIds.includes(mdle.moduleId) )

        removeTemplateElements(notReplaced, layoutEditor)
        if(loading)
            replaceTemplateElements(createdIds, layoutEditor,appStore)
        if(!loading){
            autoAddElementInLayout(diff, layoutEditor,appStore ) 
            updateElementsInLayout(diff, layoutEditor,appStore ) 
            autoRemoveElementInLayout(diff, layoutEditor,appStore ) 
        }
            
        setDynamicComponentsBlocks(appStore, layoutEditor)    
    })
    
    appObservables.activeLayerUpdated$
    .subscribe(() => { 
        setDynamicComponentsBlocks(appStore, layoutEditor)
    })

    appObservables.unselect$.subscribe(() => {
        layoutEditor.Commands.stop("show-attributes")
    })
    
    merge(appObservables.moduleSelected$,appObservables.connectionSelected$)
    .subscribe(() => {
        layoutEditor.Commands.run("show-attributes")
    })
    
    appObservables.uiStateUpdated$
    .subscribe(() => {
        layoutEditor.refresh()
    })
    loading = false 
}

export function createDrawingArea(appStore: AppStore, appObservables: AppObservables ){

    let plottersObservables = AppBuildViewObservables.getInstance()
    
    let width = 1000
    let height = 1000
    let drawingArea = createDrawingAreaSvg(
      {
        containerDivId: "wf-builder-view",
        width: width,
        height: height,
        xmin: -width / 2.,
        ymin: -width / 2.,
        xmax: width / 2.,
        ymax: width / 2.,
        margin: 50,
        overflowDisplay: { left: 1e8, right: 1e8, top: 1e8, bottom: 1e8 }
      })
          
    return new WorkflowPlotter(drawingArea, appObservables, plottersObservables, appStore)
}
