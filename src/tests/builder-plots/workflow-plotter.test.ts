import '../common/dependencies'

import { createDrawingArea }  from '@youwol/flux-svg-plots'
import { AppObservables, AppDebugEnvironment, AppStore, AppBuildViewObservables } from '../../app/builder-editor/builder-state/index'
import { WorkflowPlotter } from '../../app/builder-editor/builder-plots/index'
import { environment } from '../common/dependencies'


test('load simple project', (done) => {
    
    let div = document.createElement("div")
    div.id = "wf-builder-view"
    document.body.appendChild(div)
  
    let drawingArea = createDrawingArea(
      {  containerDivId : div.id,
          width : 100,
          height :100,
          xmin :  -50,
          ymin :  -50,
          xmax :  50.,
          ymax :  50,
          margin: 0,
          overflowDisplay:  {left:1e8,right:1e8,top:1e8,bottom:1e8}
    })  

    let appObservables = AppObservables.getInstance()
    let plottersObservables = AppBuildViewObservables.getInstance()
    AppDebugEnvironment.getInstance().debugOn = false
  
    let appStore : AppStore = AppStore.getInstance(environment)
    let wfPlotter = new WorkflowPlotter(drawingArea,appObservables,plottersObservables,appStore)
    plottersObservables.modulesDrawn$
    .subscribe( (_)=> { 
        
        appStore.selectModule("module0")
        let selectedModules = appStore.getModulesSelected()
        expect(selectedModules.length).toEqual(1)
        expect(selectedModules[0].moduleId).toEqual("module0")

        let drawingDiv = document.getElementById(div.id+"-drawing-area")        
        let eventClick = new MouseEvent('click',{button:0})
        
        drawingDiv.dispatchEvent(eventClick)

        selectedModules = appStore.getModulesSelected()
        expect(selectedModules.length).toEqual(0)

        // The issue herefafter is that offsetX/Y is undefined => no selection
        let eventMouseDown= new MouseEvent('mousedown',{ctrlKey:true,clientX:0,clientY:0})
        drawingDiv.dispatchEvent(eventMouseDown)

        expect(wfPlotter.boxSelectorPlotter.start).toBeDefined()

        let eventMouseMove= new MouseEvent('mousemove',{ctrlKey:true,clientX:55,clientY:100})
        drawingDiv.dispatchEvent(eventMouseMove)
        let highlighteds = document.querySelectorAll(".highlighted")
        expect(highlighteds.length).toEqual(1)
        expect(highlighteds[0].id).toEqual("module0")

        drawingDiv.dispatchEvent(new MouseEvent('mousemove',{ctrlKey:true,clientX:100,clientY:100}))
        highlighteds = document.querySelectorAll(".highlighted")
        expect(highlighteds.length).toEqual(2)
        expect(highlighteds[0].id).toEqual("module0")
        expect(highlighteds[1].id).toEqual("GroupModules_child-layer")

        drawingDiv.dispatchEvent(new MouseEvent('mouseup',{ctrlKey:true,clientX:100,clientY:100}))

        expect(wfPlotter.boxSelectorPlotter.start).toBeFalsy()
        selectedModules = appStore.getModulesSelected()
        expect(selectedModules.length).toEqual(2)
        expect(selectedModules[0].moduleId).toEqual("module0")
        expect(selectedModules[1].moduleId).toEqual("GroupModules_child-layer")

        let eventDelete= new KeyboardEvent('keydown',{key:"Delete"})
        window.dispatchEvent(eventDelete)
        // root component remains
        expect(appStore.project.workflow.modules.length).toEqual(1)

        done()
    })    

    appStore.loadProjectId("simpleProject")
})