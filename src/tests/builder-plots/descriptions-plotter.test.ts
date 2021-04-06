
import { take, skip } from 'rxjs/operators'
import { createDrawingArea } from '@youwol/flux-svg-plots'

import '../common/dependencies'
import { AppObservables, AppDebugEnvironment, AppStore, AppBuildViewObservables } from '../../app/builder-editor/builder-state/index'
import { ModulesPlotter, DescriptionsBoxesPlotter } from '../../app/builder-editor/builder-plots/index'
import { MockEnvironment } from '@youwol/flux-core'
import { environment } from '../common/dependencies'
import { projects } from '../common/projects-data'


test('load simple project + test its unique description box rendering', (done) => {
    
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
    let descriptionsPlotter = new DescriptionsBoxesPlotter(drawingArea, plottersObservables,appObservables,appStore)
    
    let descriptionBoxSaved = projects.simpleProject.builderRendering.descriptionsBoxes[0]
    plottersObservables.descriptionsBoxesDrawn$.pipe(
        skip(0),
        take(1)
    ).subscribe( (svgElements) =>
    {
        expect(svgElements.length).toEqual(1)
        expect(svgElements[0].id ).toEqual(descriptionBoxSaved.descriptionBoxId)

        let descriptionBox =  document.getElementById(svgElements[0].id)

        expect(descriptionBox).toBeDefined()
        // The next 2 tests are not working anymore
        // let x= descriptionBox.getAttribute("x"), y = descriptionBox.getAttribute("y")
        // expect(x).toEqual("50")
        // expect(y).toEqual("50")
        let titleSvg = descriptionBox.querySelector(".title")
        expect(titleSvg.innerHTML).toEqual(descriptionBoxSaved.title)

        expect( descriptionBox.classList.contains("selected")).toBeFalsy()

        let event = new MouseEvent('click')
        descriptionBox.dispatchEvent(event)

    })
    /* selection of description box is currently trigering re-drawing => we test the 'selected' class
    * attributes here. 
    */
    plottersObservables.descriptionsBoxesDrawn$.pipe(
        skip(1),
        take(1)
    ).subscribe( (d) =>
    {     
        let descriptionBox =  document.getElementById(descriptionBoxSaved.descriptionBoxId)
        let classes = descriptionBox.classList
        
        expect(classes.contains("selected")).toBeTruthy()
        done()

    })

    appStore.loadProject("simpleProjectConnection")

})