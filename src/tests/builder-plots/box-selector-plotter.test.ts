
import { take, skip } from 'rxjs/operators'
import { createDrawingArea } from '@youwol/flux-svg-plots'

import '../common/dependencies'
import { AppObservables, AppDebugEnvironment, AppStore, 
    AppBuildViewObservables } from '../../app/builder-editor/builder-state/index'
    
import { ModulesPlotter, BoxSelectorPlotter} from '../../app/builder-editor/builder-plots/index'
import { environment } from '../common/dependencies'


test('load simple project', (done) => {
    
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

    plottersObservables.modulesDrawn$.pipe(
        skip(0),
        take(1)
    ).subscribe( (d) =>
    {     
        let selectorPlotter = new BoxSelectorPlotter(drawingArea,plottersObservables,appObservables,appStore,mdlesPlotter)
        selectorPlotter.startSelection([0,0])

        let rectSelectorSvg = document.querySelectorAll("rect.rectangle-selector")
        expect(rectSelectorSvg.length).toEqual(1)
        let highlighteds = document.querySelectorAll(".highlighted")
        expect(highlighteds.length).toEqual(0)
        selectorPlotter.moveTo([55,100])
        highlighteds = document.querySelectorAll(".highlighted")
        expect(highlighteds.length).toEqual(1)
        expect(highlighteds[0].id).toEqual("module0")
        selectorPlotter.moveTo([1000,1000])
        highlighteds = document.querySelectorAll(".highlighted")
        expect(highlighteds.length).toEqual(2)
        expect(highlighteds[0].id).toEqual("module0")
        expect(highlighteds[1].id).toEqual("GroupModules_child-layer")

        selectorPlotter.finishSelection([100,100])
        highlighteds = document.querySelectorAll(".highlighted")
        expect(highlighteds.length).toEqual(0)

        let selecteds = appStore.getModulesSelected()
        expect(selecteds.length).toEqual(2)
        expect(selecteds[0].moduleId).toEqual("module0")
        expect(selecteds[1].moduleId).toEqual("GroupModules_child-layer")

        // make sure selectorPlotter do not crash if selection is not actually started before moved
        selectorPlotter.moveTo([50,50])
        
        done()

    })

    appStore.loadProject("simpleProject")
})