
import * as _ from 'lodash'
import { Subject, combineLatest } from 'rxjs';
import {drag as d3Drag} from 'd3-drag'
import {select} from 'd3-selection'
import { GroupModules } from '@youwol/flux-core';
import { DrawingArea, CrossPlot, toCssName } from '@youwol/flux-svg-plots';

import { AppStore, AppDebugEnvironment, LogLevel , AppBuildViewObservables, AppObservables } 
from '../builder-state/index';
import { PluginsPlotter } from './plugins-plotter';
import { getBoundingBox} from './drawing-utils';

/** Temporary until migration is complete
 * 
 * @param mdle 
 * @param drawingArea 
 */
export function  createPlot(mdle,drawingArea){

    let Factory     = mdle.Factory
    let Rendering   = new Factory.BuilderView()
    let entities$   = new Subject()
    let plotId      = toCssName(Factory.uid) + "_ModulesPlot"
    let plotter     = new CrossPlot({ 
        plotId:     plotId, 
        plotClasses:[ plotId,Factory.packId ],drawingArea,
        entities$
    })
    plotter.defaultElementDisplay = (d)=> Rendering.render(d.data.module)
    return  plotter    
}


function getCenter(currentViews) {

    let views = currentViews.modulesView
    let coorsParentLayer = views.map( m => [m.xWorld,m.yWorld])
    let xmin = coorsParentLayer.reduce((acc,e) =>acc<e[0]?acc:e[0] ,1.e10) 
    let xmax = coorsParentLayer.reduce((acc,e) =>acc>e[0]?acc:e[0] ,-1.e10) 
    let ymin = coorsParentLayer.reduce((acc,e) =>acc<e[1]?acc:e[1] ,1.e10) 
    let ymax = coorsParentLayer.reduce((acc,e) =>acc>e[1]?acc:e[1] ,-1.e10) 
    return [(xmax+xmin)/2,(ymax+ymin)/2]
}

function getScaleFactors(currentViews){

    let views = currentViews.modulesView
    let coorsParentLayer = views.map( m => [m.xWorld,m.yWorld])
    let xmin = coorsParentLayer.reduce((acc,e) =>acc<e[0]?acc:e[0] ,1.e10) 
    let xmax = coorsParentLayer.reduce((acc,e) =>acc>e[0]?acc:e[0] ,-1.e10) 
    let ymin = coorsParentLayer.reduce((acc,e) =>acc<e[1]?acc:e[1] ,1.e10) 
    let ymax = coorsParentLayer.reduce((acc,e) =>acc>e[1]?acc:e[1] ,-1.e10) 
    return [(xmax-xmin)/2,(ymax-ymin)/2]
}

function drawModules(
    drawingArea : DrawingArea,  
    appStore : AppStore,
    plotObservables$  ){
      
    let allPlots = []      
    let displayedModulesView = appStore.getDisplayedModulesView()
    let projection = undefined       

    if(appStore.activeLayerId != appStore.rootLayerId ){

        let center = getCenter(displayedModulesView.currentLayer)
        let factors = getScaleFactors(displayedModulesView.currentLayer)
        let moduleViewLayer = displayedModulesView.parentLayer.currentGroupModuleView
        
        projection = (x,y)=>{
            let d0 = Math.pow( (x-moduleViewLayer.xWorld)*(x-moduleViewLayer.xWorld) + (y-moduleViewLayer.yWorld) * (y-moduleViewLayer.yWorld) ,0.5)
            let cos_theta0 = (x-moduleViewLayer.xWorld)/d0
            let sin_theta0 = (y-moduleViewLayer.yWorld)/d0
            let dx = ( d0 + factors[0]) * cos_theta0 + cos_theta0/Math.abs(cos_theta0) * 50
            let dy = ( d0 + factors[1]) * sin_theta0 + sin_theta0/Math.abs(sin_theta0) * 75
            return [ center[0] + dx, center[1] + dy ]
        }
    }
    let fromModuleViewInside = (view)=>({
        x: view.xWorld, 
        y:view.yWorld,
        classes:["module"].concat( appStore.isSelected(view.moduleId) ? ["selected"] : []),
        attributes:{ moduleId : view.moduleId },
        id: view.moduleId,
        Factory: view.Factory,
        data:{module:appStore.getModule(view.moduleId),
            moduleView : view } 
    })
    let fromModuleOutside = (view)=>Object.assign({}, fromModuleViewInside(view), {projection:projection})

    let plotsData0 = displayedModulesView.currentLayer.modulesView.map(fromModuleViewInside)
    let plotsData1 = displayedModulesView.parentLayer.modulesView.map(fromModuleOutside)

    let grouped          = _.groupBy([...plotsData0,...plotsData1], d => d.Factory.uid  )
    let modulesDrawn     = {}
    let activeSeriesId   = []
    let updateMdlesDrawn = (d)=>{
        d.filter(g=>g).forEach( g => {
            if( g.id.includes("group") ){
                let m = appStore.getModule(g.id)
                let mIds = m.inputSlots.map( s => s.moduleId ).concat(m.outputSlots.map( s => s.moduleId ))
                mIds.forEach( mid =>{  modulesDrawn[mid] = g })
            }
        modulesDrawn[g.id] = g 
        })
    }

    Object.entries(grouped).map( ([factId,modules] : [string, Array<any>]) => {
        
        let plot = createPlot(modules[0] , drawingArea )
        
        activeSeriesId.push(plot.plotId)
        allPlots.push(plot)  
        let groups = plot.draw(modules)   
        
        groups.entered._groups.forEach( d =>  updateMdlesDrawn(d))
        groups.updated._groups.forEach( d =>  updateMdlesDrawn(d))

        plot.entities$.subscribe( d=> plotObservables$.next(d)) 
        return plot
    })
    return {modulesDrawn : modulesDrawn,
            activeSeries : activeSeriesId }
}


function drawExpandedGroup( layerId :string, drawingArea : DrawingArea, appStore : AppStore ){
    
    if(!layerId || layerId === appStore.rootLayerId ){
        let plotter = new CrossPlot({ plotId:"activeLayerPlotter", plotClasses:[], drawingArea, entities:[]})
        plotter.draw([])
        return {}
    }
    let activateLayer = appStore.getLayer(layerId)
    let groupMdle = appStore.project.workflow.modules
    .find( m => m instanceof GroupModules.Module && m.moduleId == activateLayer.moduleId) as GroupModules.Module

    const displayedElements = appStore.getDisplayedModulesView()
    const includedEntities  = displayedElements.currentLayer.modulesView.map(g => g.moduleId)
    let rect                = getBoundingBox(includedEntities,50,drawingArea)
    
    let x = drawingArea.hScale.invert( rect.x + rect.width/2)
    let y = drawingArea.vScale.invert( rect.y + rect.height/2)
    let plotData =  [{ 
        id: "expanded_"+groupMdle.moduleId, 
        x: x, y: y, 
        classes:["active-layer-box"], 
        attributes:{ layerId : layerId },
        data:{boundingBox:rect }}]

    let plotter = new CrossPlot({ plotId:"activeLayerPlotter",plotClasses:[],
                                  drawingArea: drawingArea, entities:plotData})
    
    plotter.defaultElementDisplay = GroupModules.expandedGroupPlot(groupMdle)
    
    let drawnElements = plotter.draw(plotData)
    let all = drawnElements.entered._groups.concat(drawnElements.updated._groups).reduce( (acc,e)=>acc.concat(e),[]).filter(g=>g)
    return {[groupMdle.moduleId]: all[0]}
}

export class ModulesPlotter{
    
    plotsFactory : Object = {}

    debugSingleton = AppDebugEnvironment.getInstance()

    modulePlots : Array<CrossPlot> = []
    pluginsPlotter: PluginsPlotter

    previousActiveSeriesId = []

    constructor( public readonly drawingArea : DrawingArea,
                 public readonly plottersObservables: AppBuildViewObservables,
                 public readonly appObservables: AppObservables,
                 public readonly appStore : AppStore){
                     
        let plotObservables$ = new Subject<any>()

        this.debugSingleton.debugOn && 
        this.debugSingleton.logWorkflowView( {  
            level : LogLevel.Info, 
            message: "create modules plotter", 
            object: { drawingArea : drawingArea,
                      plottersObservables : plottersObservables}
        });

        // This line is for ensuring that the active layer is plotted behind everything else :/
        (new CrossPlot({ plotId:"activeLayerPlotter", plotClasses:[], drawingArea: drawingArea, entities:[]})).draw([])

        this.pluginsPlotter = new PluginsPlotter(this.drawingArea, this.plottersObservables, 
            this.appObservables, this.appStore)

        combineLatest([appObservables.packagesLoaded$,  this.plottersObservables.modulesViewUpdated$])
        .subscribe(
            () => {
                let { modulesDrawn, activeSeries } = drawModules(this.drawingArea, this.appStore, plotObservables$)
                let pluginsDrawn = this.pluginsPlotter.draw(modulesDrawn)
                let expandedGroup = drawExpandedGroup( this.appStore.activeLayerId, this.drawingArea, this.appStore )
                this.connectUserInteractions(Object.assign({},modulesDrawn,expandedGroup))
                this.emptyRemovedSeries(this.previousActiveSeriesId, activeSeries)   
                this.previousActiveSeriesId =  activeSeries
                this.plottersObservables.modulesDrawn$.next({...modulesDrawn,...pluginsDrawn,...expandedGroup})
            }
        )
        
        this.appObservables.moduleSelected$.subscribe(
            mdle =>{
                let elem =  document.getElementById(mdle.moduleId)
                if(elem && !elem.classList.contains("selected"))
                    elem.classList.add("selected")}
        )
        
        this.appObservables.modulesUnselected$.subscribe(
            mdles =>{
                mdles.forEach( mdle => {
                let elem =  document.getElementById(mdle.moduleId)
                if(elem && elem.classList.contains("selected"))
                    elem.classList.remove("selected")
                })
        })

        appObservables.unselect$.subscribe( ()=> {
            this.unselect()
        })       
    }

    highlight(modulesId:Array<String>){

        let htmlElems= modulesId
        .map( (mid:string) => document.getElementById(mid))
        htmlElems.forEach( e => { if(e) e.classList.add("highlighted") })
    }
    unselect(){

        let htmlElems = document.getElementsByClassName("selected")
        while(htmlElems.length>0){            
            htmlElems[0].classList.remove("selected")
            htmlElems = document.getElementsByClassName("selected")
        }
        htmlElems= document.getElementsByClassName("highlighted")
        while(htmlElems.length>0){            
            htmlElems[0].classList.remove("highlighted")
            htmlElems = document.getElementsByClassName("highlighted")
        }
    }

    dragging = false
    dragTranslation = [0,0]

    connectUserInteractions(modulesDrawn){
         
        Object.entries(modulesDrawn).forEach( ([moduleId, g] : [string,SVGElement])=> {
            let onclick = (event:any) => { 
                if( event.target.classList.contains("slot") ){
                    event.target.classList.contains("output")?
                        this.plottersObservables.plugOutputClicked$.next({event,group:g,moduleId}):                        
                        this.plottersObservables.plugInputClicked$.next({event,group:g,moduleId})
                    return
                }
                event.stopPropagation(); 
                this.appStore.selectModule(moduleId)
            }
            g.onclick     = onclick
            g.onmousedown = onclick
            
            if(this.appStore.project.workflow.plugins.map(m=>m.moduleId).includes(moduleId))
                return
            if(g.classList.contains("active-layer-box"))
                return

            var drag = d3Drag();
            drag
            .on("start",  (ev) => {
                this.dragSelection( ev, false )})
            .on("drag",   (ev) => this.dragSelection( ev, false ))
            .on("end",    (ev) => this.dragSelection( ev, true ))
            select(g).call(drag) 
        })
    }

    emptyRemovedSeries(oldSeries, newSeries) {
        let removeds = oldSeries.filter( name => !newSeries.includes(name))
        removeds.forEach( name => document.querySelector("g#"+name).remove())
    }

    dragSelection( d3Event, update )  {

        this.dragging = true
        let modules = this.appStore
        .getModulesSelected()
        .filter( m =>this.appStore.getActiveLayer().getModuleIds().includes(m.moduleId) || m["layerId"] )

        let newPos = []
        modules.forEach( m => {
            let g = document.getElementById(m.moduleId)
            let plugins = g.querySelectorAll('g.plugin')
            let x = Number(g.getAttribute("x")) + d3Event.dx 
            let y = Number(g.getAttribute("y")) + d3Event.dy
            Array.from(plugins).forEach( gPlugin => {
                gPlugin.setAttribute( "x", Number(gPlugin.getAttribute("x")) + d3Event.dx)
                gPlugin.setAttribute( "y", Number(gPlugin.getAttribute("y")) + d3Event.dy)
            })
            this.dragTranslation[0] += d3Event.dx 
            this.dragTranslation[1] -= d3Event.dy 
            g.setAttribute( "x",x)
            g.setAttribute( "y",y)
            g.style.transform = "translate("+ x+"px,"+y+"px)"
            g.setAttribute("transform" , "translate("+ x+","+y+")" )
            if(update){
                newPos.push({
                    moduleId:m.moduleId, 
                    x:this.drawingArea.hScale.invert(x),
                    y:this.drawingArea.vScale.invert(y),
                    translation: this.dragTranslation })
                g.style.transform = ""
            }
        })
        if(update){
            this.appStore.moveModules(newPos)
            this.dragging = false
            this.dragTranslation = [0,0]
        }
        return newPos
    }
}