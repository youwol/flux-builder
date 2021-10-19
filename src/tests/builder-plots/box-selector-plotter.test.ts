
import { take, skip } from 'rxjs/operators'
import { createDrawingArea } from '@youwol/flux-svg-plots'

import '../common/dependencies'
import { AppObservables, AppDebugEnvironment, AppStore, 
    AppBuildViewObservables } from '../../app/builder-editor/builder-state/index'
    
import { ModulesPlotter, BoxSelectorPlotter} from '../../app/builder-editor/builder-plots/index'
import { environment } from '../common/dependencies'


test('load simple project', (done) => {
    
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

    plottersObservables.modulesDrawn$.pipe(
        skip(0),
        take(1)
    ).subscribe( (d) =>
    {     
        const selectorPlotter = new BoxSelectorPlotter(drawingArea,plottersObservables,appObservables,appStore,mdlesPlotter)
        selectorPlotter.startSelection([0,0])

        const rectSelectorSvg = document.querySelectorAll("rect.rectangle-selector")
        expect(rectSelectorSvg).toHaveLength(1)
        let highlighteds = document.querySelectorAll(".highlighted")
        expect(highlighteds).toHaveLength(0)
        selectorPlotter.moveTo([55,100])
        highlighteds = document.querySelectorAll(".highlighted")
        expect(highlighteds).toHaveLength(1)
        expect(highlighteds[0].id).toBe("module0")
        selectorPlotter.moveTo([1000,1000])
        highlighteds = document.querySelectorAll(".highlighted")
        expect(highlighteds).toHaveLength(2)
        expect(highlighteds[0].id).toBe("module0")
        expect(highlighteds[1].id).toBe("GroupModules_child-layer")

        selectorPlotter.finishSelection([100,100])
        highlighteds = document.querySelectorAll(".highlighted")
        expect(highlighteds).toHaveLength(0)

        const selecteds = appStore.getModulesSelected()
        expect(selecteds).toHaveLength(2)
        expect(selecteds[0].moduleId).toBe("module0")
        expect(selecteds[1].moduleId).toBe("GroupModules_child-layer")

        // make sure selectorPlotter do not crash if selection is not actually started before moved
        selectorPlotter.moveTo([50,50])
        
        done()

    })

    appStore.loadProjectId("simpleProject")
})