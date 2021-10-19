import '../common/dependencies'

import { createDrawingArea }  from '@youwol/flux-svg-plots'
import { AppObservables, AppDebugEnvironment, AppStore, AppBuildViewObservables } from '../../app/builder-editor/builder-state/index'
import { WorkflowPlotter } from '../../app/builder-editor/builder-plots/index'
import { environment } from '../common/dependencies'


test('load simple project', (done) => {
    
    const div = document.createElement("div")
    div.id = "wf-builder-view"
    document.body.appendChild(div)
  
    const drawingArea = createDrawingArea(
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

    const appObservables = AppObservables.getInstance()
    const plottersObservables = AppBuildViewObservables.getInstance()
    AppDebugEnvironment.getInstance().debugOn = false
  
    const appStore : AppStore = AppStore.getInstance(environment)
    const wfPlotter = new WorkflowPlotter(drawingArea,appObservables,plottersObservables,appStore)
    plottersObservables.modulesDrawn$
    .subscribe( (_)=> { 
        
        appStore.selectModule("module0")
        let selectedModules = appStore.getModulesSelected()
        expect(selectedModules).toHaveLength(1)
        expect(selectedModules[0].moduleId).toBe("module0")

        const drawingDiv = document.getElementById(div.id+"-drawing-area")        
        const eventClick = new MouseEvent('click',{button:0})
        
        drawingDiv.dispatchEvent(eventClick)

        selectedModules = appStore.getModulesSelected()
        expect(selectedModules).toHaveLength(0)

        // The issue herefafter is that offsetX/Y is undefined => no selection
        const eventMouseDown= new MouseEvent('mousedown',{ctrlKey:true,clientX:0,clientY:0})
        drawingDiv.dispatchEvent(eventMouseDown)

        expect(wfPlotter.boxSelectorPlotter.start).toBeDefined()

        const eventMouseMove= new MouseEvent('mousemove',{ctrlKey:true,clientX:55,clientY:100})
        drawingDiv.dispatchEvent(eventMouseMove)
        let highlighteds = document.querySelectorAll(".highlighted")
        expect(highlighteds).toHaveLength(1)
        expect(highlighteds[0].id).toBe("module0")

        drawingDiv.dispatchEvent(new MouseEvent('mousemove',{ctrlKey:true,clientX:100,clientY:100}))
        highlighteds = document.querySelectorAll(".highlighted")
        expect(highlighteds).toHaveLength(2)
        expect(highlighteds[0].id).toBe("module0")
        expect(highlighteds[1].id).toBe("GroupModules_child-layer")

        drawingDiv.dispatchEvent(new MouseEvent('mouseup',{ctrlKey:true,clientX:100,clientY:100}))

        expect(wfPlotter.boxSelectorPlotter.start).toBeFalsy()
        selectedModules = appStore.getModulesSelected()
        expect(selectedModules).toHaveLength(2)
        expect(selectedModules[0].moduleId).toBe("module0")
        expect(selectedModules[1].moduleId).toBe("GroupModules_child-layer")

        const eventDelete= new KeyboardEvent('keydown',{key:"Delete"})
        window.dispatchEvent(eventDelete)
        // root component remains
        expect(appStore.project.workflow.modules).toHaveLength(1)

        done()
    })    

    appStore.loadProjectId("simpleProject")
})