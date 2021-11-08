
import { environment } from '../common/dependencies'
import { createDrawingArea } from '@youwol/flux-svg-plots'
import { AppObservables, AppDebugEnvironment, AppStore, 
    AppBuildViewObservables }  from '../../app/builder-editor/builder-state/index'
    
import { take, skip, filter } from 'rxjs/operators'
import { ModulesPlotter } from '../../app/builder-editor/builder-plots/index'
import {packCore} from '@youwol/flux-core'

test('load simple project', (done) => {
    const p = packCore
    const div = document.createElement("div")
    div.id = "plot-container"
    document.body.appendChild(div)
  
    const drawingArea = createDrawingArea(
      {  containerDivId : "plot-container",
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
    const mdlesPlotter = new ModulesPlotter(drawingArea, plottersObservables,appObservables,appStore)
    
    appObservables.ready$.pipe(
        filter(d => d)
    ).subscribe( (_)=> {
        appStore.selectActiveGroup("GroupModules_child-layer")
    })
    
    plottersObservables.modulesDrawn$.pipe(
        skip(0),
        take(1)
    ).subscribe( (svgElements) =>{
        
        const groupElem = svgElements["GroupModules_child-layer"]
        expect(groupElem).toBeDefined()
        expect(groupElem.id ).toBe("expanded_GroupModules_child-layer")
        const elemInDocument =  document.getElementById("expanded_GroupModules_child-layer")

        expect(elemInDocument).toBeDefined()
        const x= elemInDocument.getAttribute("x"), y = elemInDocument.getAttribute("y")
        expect(x).toBe("60")
        expect(y).toBe("50")
        const titleSvg = elemInDocument.querySelector(".title")
        expect(titleSvg.innerHTML).toBe("group")

        const layerSvg =  document.querySelector(".active-layer-box")
        expect(layerSvg).toBeDefined()
        appStore.selectActiveGroup(appStore.getRootComponent().moduleId)
    })

    plottersObservables.modulesDrawn$.pipe(
        skip(1),
        take(1)
    ).subscribe( (_) =>{
        const layerSvg =  document.querySelector(".active-layer-box")
        expect(layerSvg).toBeFalsy()
        appStore.selectActiveGroup("GroupModules_child-layer")
    })
    plottersObservables.modulesDrawn$.pipe(
        skip(2),
        take(1)
    ).subscribe( (_) =>{
        const layerSvg =  document.getElementById("GroupModules_child-layer")
        expect(layerSvg).toBeDefined()
        done()
    })

    appStore.loadProjectId("simpleProject")
})