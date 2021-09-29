
import '../common/dependencies'
import { createDrawingArea } from '@youwol/flux-svg-plots'
import { AppObservables, AppDebugEnvironment, AppStore, 
    AppBuildViewObservables }  from '../../app/builder-editor/builder-state/index'
    
import { take, skip, filter } from 'rxjs/operators'
import { ModulesPlotter } from '../../app/builder-editor/builder-plots/index'
import { environment } from '../common/dependencies'
import {packCore} from '@youwol/flux-core'

test('load simple project', (done) => {
    let p = packCore
    let div = document.createElement("div")
    div.id = "plot-container"
    document.body.appendChild(div)
  
    let drawingArea = createDrawingArea(
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
  
    
    let appObservables = AppObservables.getInstance()
    let plottersObservables = AppBuildViewObservables.getInstance()
    AppDebugEnvironment.getInstance().debugOn = false
  
    let appStore : AppStore = AppStore.getInstance(environment)
    let mdlesPlotter = new ModulesPlotter(drawingArea, plottersObservables,appObservables,appStore)
    
    appObservables.ready$.pipe(
        filter(d => d)
    ).subscribe( (_)=> {
        appStore.selectActiveLayer("child-layer")
    })
    
    plottersObservables.modulesDrawn$.pipe(
        skip(0),
        take(1)
    ).subscribe( (svgElements) =>{
        
        let groupElem = svgElements["GroupModules_child-layer"]
        expect(groupElem).toBeDefined()
        expect(groupElem.id ).toEqual("expanded_GroupModules_child-layer")
        let elemInDocument =  document.getElementById("expanded_GroupModules_child-layer")

        expect(elemInDocument).toBeDefined()
        let x= elemInDocument.getAttribute("x"), y = elemInDocument.getAttribute("y")
        expect(x).toEqual("60")
        expect(y).toEqual("50")
        let titleSvg = elemInDocument.querySelector(".title")
        expect(titleSvg.innerHTML).toEqual("group")

        let layerSvg =  document.querySelector(".active-layer-box")
        expect(layerSvg).toBeDefined()
        appStore.selectActiveLayer(appStore.getRootLayer().moduleId)
    })

    plottersObservables.modulesDrawn$.pipe(
        skip(1),
        take(1)
    ).subscribe( (_) =>{
        let layerSvg =  document.querySelector(".active-layer-box")
        expect(layerSvg).toBeFalsy()
        appStore.selectActiveLayer("child-layer")
    })
    plottersObservables.modulesDrawn$.pipe(
        skip(2),
        take(1)
    ).subscribe( (_) =>{
        let layerSvg =  document.getElementById("GroupModules_child-layer")
        expect(layerSvg).toBeDefined()
        done()
    })

    appStore.loadProjectId("simpleProject")
})