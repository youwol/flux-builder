
import { combineLatest, merge, ReplaySubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import * as grapesjs from 'grapesjs'

import { ModuleFlow, FluxExtensionAPIs, Environment } from '@youwol/flux-core';
import { createDrawingArea } from '@youwol/flux-svg-plots';
import { ContextMenu } from '@youwol/fv-context-menu';

import { AppStore, AppObservables, UiState, AppDebugEnvironment, 
    LogLevel, AppBuildViewObservables } from './builder-editor/builder-state/index';
import { WorkflowPlotter } from './builder-editor/builder-plots/index';
import { createAttributesPanel, ContextMenuState, ExplorerTreeState } from './builder-editor/index'

import { createLayoutEditor, initLayoutEditor, setDynamicComponentsBlocks,
    replaceTemplateElements, removeTemplateElements, autoAddElementInLayout  } from './layout-editor/index';

import { Notifier } from './notification';


let {appStore, appObservables, layoutEditor} = await initializeRessources()

let workflowPlotter = initDrawingArea(appStore,appObservables)

connectStreams(appStore, workflowPlotter, layoutEditor, appObservables )

let projectId = getUrlParams()["id"]

appStore.loadProject(projectId)


export async function initializeRessources() : 
    Promise<{ appStore: AppStore, appObservables: AppObservables, layoutEditor: grapesjs.Editor }>{

    let defaultLog      = false
    let appObservables  = AppObservables.getInstance()
    let debugSingleton  = AppDebugEnvironment.getInstance()

    debugSingleton.workflowUIEnabled       = defaultLog
    debugSingleton.observableEnabled       = defaultLog
    debugSingleton.workflowUIEnabled       = defaultLog
    debugSingleton.workflowViewEnabled     = defaultLog
    debugSingleton.WorkflowBuilderEnabled  = defaultLog
    debugSingleton.renderTopicEnabled      = defaultLog
    debugSingleton.workflowView$Enabled    = defaultLog

    let layoutEditor : any = await createLayoutEditor()
    let doc = layoutEditor.Canvas.getDocument() as HTMLDocument
    let environment = new Environment(
        {   
            renderingWindow: doc.defaultView,
            executingWindow: window
        }
    )
    
    debugSingleton.logWorkflowBuilder( {  
      level : LogLevel.Info, 
      message: "Environment", 
      object:{ environment }
    })
    
    let appStore = AppStore.getInstance( environment )

    // install extensions
    //prettyDebug.factory.install( appStore.appExtensionsObservables )

    return { 
        appStore,
        appObservables,
        layoutEditor
    }
}

function setUiState(state: UiState){   

    let renderNode  = document.getElementById("render-component")
    let builderNode = document.getElementById("builder-component")

    builderNode.classList.remove("combined","builder","render","none")
    renderNode.classList.remove("combined","builder","render","none")
    builderNode.classList.add(state.mode)
    renderNode.classList.add(state.mode)
}

export function connectStreams(appStore:AppStore, workflowPlotter: WorkflowPlotter, layoutEditor: grapesjs.Editor, appObservables:AppObservables ){

    let loading = true

    appObservables.packagesLoaded$.subscribe( ()=> document.getElementById("loading-screen").remove() )
    appObservables.uiStateUpdated$.subscribe( (state:UiState)=> setUiState(state) )
    appObservables.adaptorEdited$.subscribe( ({adaptor,connection} : {adaptor:any,connection:any}) => {/*this.editAdaptor(adaptor,connection)*/})
    
    let layoutEditor$ = new ReplaySubject(1)
    
    appObservables.renderingLoaded$.subscribe( (d) => {
        initLayoutEditor(layoutEditor, d, appStore)
        layoutEditor$.next(layoutEditor)
    })
        
    combineLatest([layoutEditor$,appObservables.modulesUpdated$])
    .subscribe(([editor,diff] :[any,any]) => { 
        
        let notReplaced = diff.removedElements.filter( mdle => !diff.createdElements.map(m =>m.moduleId).includes(mdle.moduleId) )
        removeTemplateElements(notReplaced, editor)
        if(loading)
            replaceTemplateElements(diff.createdElements.map( (m:ModuleFlow)=> m.moduleId), editor,appStore)
        if(!loading)
            autoAddElementInLayout(diff, editor,appStore )
        
        setDynamicComponentsBlocks(appStore, editor)    
    })
    
    combineLatest([layoutEditor$,appObservables.activeLayerUpdated$])
    .subscribe(([editor,diff] :[any,any]) => { 
        setDynamicComponentsBlocks(appStore, editor)
    })

    combineLatest([layoutEditor$, appObservables.uiStateUpdated$]).pipe(
        filter( ( [editor, state]:[any,UiState])=> state.mode ==="combined" || state.mode ==="render"  )
    ).subscribe( ( [editor, state]:[any,UiState])=> replaceTemplateElements(appStore.project.workflow.modules.map( m => m.moduleId), editor, appStore)
    )
    
    combineLatest([layoutEditor$,appObservables.unselect$])
    .subscribe(([editor,_] :[any,any]) => {
        editor.Commands.stop("show-attributes")
    })
    
    let selection$ = merge(appObservables.moduleSelected$,appObservables.connectionSelected$)
    combineLatest([layoutEditor$,selection$]).subscribe(([editor,_] : [any,any]) => {
        editor.Commands.run("show-attributes")
    })
    
    combineLatest([layoutEditor$,appObservables.uiStateUpdated$])
    .subscribe(([editor,_] : [any,any]) => {
        editor.refresh()
    })

    appObservables.ready$.subscribe(() => {
        document.getElementById("attributes-panel").appendChild(createAttributesPanel(appStore, appObservables))
        installExtensionAPI()
    })

    layoutEditor$.subscribe( r => {
        loading = false 
    })
}

export function initDrawingArea(appStore: AppStore, appObservables: AppObservables ){

    let plottersObservables = AppBuildViewObservables.getInstance()
    
    let width = 1000//parentDiv.clientWidth
    let height = 1000//parentDiv.clientHeight
    let drawingArea = createDrawingArea(
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
          
    // A single instance of assets browser to keep in memory expandeds nodes etc
    appStore['assetsExplorerState'] = new ExplorerTreeState(appStore)
    let contextState = new ContextMenuState( appStore, drawingArea )
    new ContextMenu.View({state:contextState, class:"fv-bg-background"} as any)

    return new WorkflowPlotter(drawingArea, appObservables, plottersObservables, appStore)
}


export class ExtensionAPI{

    static message( {message, title, actions} ){
        Notifier.notify({message, title, actions})
    }
    static warning( {message, title, actions} ){
        Notifier.warning({ message, title, actions})
    }  
    static error( {message, title, actions} ){
        Notifier.error({ message, title, actions})
    }
}


export function installExtensionAPI(){ 
    FluxExtensionAPIs.registerAPI('Host', ExtensionAPI)
}

function getUrlParams() {

    let urlParams: any = {}
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, (m, key, value) => {
      urlParams[key] = value;
      return value
    });
    return urlParams
  }
