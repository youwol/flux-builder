
import { FluxExtensionAPIs } from '@youwol/flux-core';
import { DrawingArea } from '@youwol/flux-svg-plots';

import { AppStore, AppDebugEnvironment, LogLevel, AppObservables, 
    AppBuildViewObservables  } from '../builder-state/index';

import { ConnectionsPlotter } from './connections-plotter';
import { ModulesPlotter } from './modules-plotter';
import { BoxSelectorPlotter } from './box-selector-plotter';
import { DescriptionsBoxesPlotter } from './descriptions-boxes-plotter';
import { PluginsPlotter } from './plugins-plotter';
import { plugLayersTransition_noTransition } from './drawing-utils';
import { BuilderRenderingAPI } from './extension';

export class WorkflowPlotter{

    debugSingleton = AppDebugEnvironment.getInstance()

    
    modulesPlotter : ModulesPlotter = undefined
    connectionsPlotters : ConnectionsPlotter = undefined
    boxSelectorPlotter : BoxSelectorPlotter = undefined
    descriptionsBoxesPlotter : DescriptionsBoxesPlotter = undefined
    pluginsPlotter : PluginsPlotter = undefined

    constructor( public readonly drawingArea : DrawingArea,
                 public readonly appObservables: AppObservables,
                 public readonly plottersObservables : AppBuildViewObservables,
                 public readonly appStore : AppStore,
                 public readonly options = { margin : 50}){
                
        this.descriptionsBoxesPlotter= new DescriptionsBoxesPlotter(this.drawingArea, this.plottersObservables, 
            this.appObservables, this.appStore)

        this.modulesPlotter = new ModulesPlotter(this.drawingArea, this.plottersObservables, 
            this.appObservables, this.appStore)
        
        this.connectionsPlotters = new ConnectionsPlotter(this.drawingArea, this.plottersObservables, 
            this.appObservables, this.appStore)

        this.boxSelectorPlotter = new BoxSelectorPlotter(this.drawingArea, this.plottersObservables, 
            this.appObservables, this.appStore, this.modulesPlotter)
            
        plugLayersTransition_noTransition(this.appObservables.activeLayerUpdated$, this.appStore, this.drawingArea)
        
        this.debugSingleton.debugOn && 
        this.debugSingleton.logWorkflowView( {  
            level : LogLevel.Info, 
            message: "create WorkflowPlotter", 
            object: { 
                drawingArea: this.drawingArea,
                modulePlotter : this.modulesPlotter,
                connectionsPlotters: this.connectionsPlotters
            }
        })

        let plotObservable = this.plottersObservables
        let boxSelectorPlotter = this.boxSelectorPlotter
        let background = document.querySelector("svg") as SVGElement

        let toPosition = (event: MouseEvent)=>
            [event.offsetX || event.clientX, event.offsetY || event.clientY]
        
        background.onmousedown = (event) =>  { 
            boxSelectorPlotter.startSelection(toPosition(event))
        }
        background.onmousemove = (event) => {             
            if(event.ctrlKey)
                boxSelectorPlotter.moveTo(toPosition(event))
            else
                plotObservable.mouseMoved$.next(toPosition(event)) 
               
        }
        background.onmouseup = (event) => { 
            if(event.ctrlKey)
                boxSelectorPlotter.finishSelection(toPosition(event))
        }
        background.onclick = (event)  => { 
            if(!event.ctrlKey )
                appStore.unselect()
        }
        window.onkeydown = (event) => { 
            if(event.key=="Delete" && document.activeElement.tagName=="BODY") 
                this.appStore.deleteSelected()
        }   
        this.loadExtensions()   
    }

    loadExtensions(){
        // this test is for backward compatibility w/ flux-lib-core
        if(!FluxExtensionAPIs)
            return
        BuilderRenderingAPI.initialize(this)
        FluxExtensionAPIs.registerAPI('BuilderRenderingAPI', BuilderRenderingAPI)
    }
}
