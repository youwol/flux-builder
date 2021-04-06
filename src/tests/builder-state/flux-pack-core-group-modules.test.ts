import  './dependencies'
import { AppDebugEnvironment, AppObservables, AppStore} from '../../app/builder-editor/builder-state/index'
import { GroupModules } from '@youwol/flux-core'
import { filter } from 'rxjs/operators'

import * as FluxEntitiesPlot  from '@youwol/flux-svg-plots';
import { environment } from '../common/dependencies'
import { projects } from '../common/projects-data'


test('group modules module creation', done => {

    let div = document.createElement("div")
    div.id = "plot-container"
    document.body.appendChild(div)
  
    let drawingArea = FluxEntitiesPlot.createDrawingArea(
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
    AppDebugEnvironment.getInstance().debugOn = false
  
    let appStore : AppStore = AppStore.getInstance(environment)
    let projectData = projects.simpleProjectConnection

    let Factory : any = GroupModules
    let conf = new Factory.Configuration("title", "Description", {})
    appObservables.ready$.pipe(
        filter( d=>d)
    ).subscribe( ()=>{
        /*
                          |~module2~|\
                                      \
                                       \
        |~module3~|-----||~module1~||----|~module0~|-
                        ||~module1~||----|~plugin ~|
        */
        let groupModule = new Factory.Module({
            moduleId:"groupModulesId",
            configuration:conf,
            workflowGetter: (_)=>appStore.project.workflow,
            layerId:"child-layer",
            ready$:appObservables.ready$})
        let connections = groupModule.getConnections()
        expect(connections.implicits.inputs.length).toEqual(1)
        expect(connections.implicits.outputs.length).toEqual(2)
        let renderer = new  Factory.BuilderView(FluxEntitiesPlot)
        
        let plot = renderer.render(groupModule)

        let svgInputsElement = plot.querySelectorAll(".slot.input")
        expect(svgInputsElement.length).toEqual(1)
        // there is only one because it is actually the same input that is referenced 
        let svgOutputsElement = plot.querySelectorAll(".slot.output")
        expect(svgOutputsElement.length).toEqual(1)

        done()
    })  

    appStore.loadProject("simpleProjectConnection")
  })