
import { take, skip } from 'rxjs/operators'

import { createDrawingArea } from '@youwol/flux-svg-plots'

import '../common/dependencies'
import { AppObservables, AppDebugEnvironment, AppStore, 
  AppBuildViewObservables } from '../../app/builder-editor/builder-state/index'
import { ModulesPlotter } from '../../app/builder-editor/builder-plots/index'
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
    let plotter = new ModulesPlotter(drawingArea, plottersObservables,appObservables,appStore)    

    plottersObservables.modulesDrawn$.pipe(take(1)).subscribe( ()=>{

      let modules = document.querySelectorAll("g.module.entity")
      expect(modules.length).toEqual(2)

      let module0 = document.getElementById("module0")
      expect(module0).toBeDefined()
      expect(module0.getAttribute("transform")).toEqual("translate(50,50)")
      let groupMdle = document.getElementById("GroupModules_child-layer")
      expect(groupMdle.getAttribute("transform")).toEqual("translate(60,50)")
      expect(document.getElementById("module1")).toEqual(null)

      //let plugins = document.querySelectorAll("g.plugin")
      //expect(plugins.length).toEqual(1)
      let pluginDom = document.getElementById("plugin0")
      expect(pluginDom).toBeDefined()
      expect(pluginDom.parentElement.id).toEqual("module0")
      
      let module = document.getElementById("module0")
      let event = new MouseEvent('click',{button:0})
      module.dispatchEvent(event)
      plotter.highlight(["module0","module1"])

      expect(module0.classList.contains("highlighted")).toBeTruthy()

      appStore.unselect()
      expect(module0.classList.contains("highlighted")).toBeFalsy()

      let modulesView = appStore.getActiveModulesView()

      expect(modulesView.length).toEqual(2)
      expect(modulesView[0].moduleId).toEqual("module0")
      expect(modulesView[0].xWorld).toEqual(0)
      expect(modulesView[0].yWorld).toEqual(0)
      expect(modulesView[1].moduleId).toEqual("GroupModules_child-layer")
      expect(modulesView[1].xWorld).toEqual(10)
      expect(modulesView[1].yWorld).toEqual(0)
      
      appStore.selectModule("module0")
      plotter.dragSelection( {dx:2,dy:0 }, false)
      plotter.dragSelection( {dx:1,dy:1 }, true)

      plottersObservables.modulesDrawn$.next({})
    })  

    plottersObservables.modulesDrawn$.pipe(skip(1),take(1)).subscribe(
      ()=>{
        let module0 = document.getElementById("module0")
        expect(module0).toBeDefined()
        expect(module0.getAttribute("transform")).toEqual("translate(53,51)")

        appStore.selectActiveGroup("child-layer")
        let modulesView = appStore.getActiveModulesView()
        expect(modulesView.length).toEqual(2) // plugin not here, should it be?
        let mdleView1 =  modulesView.find( m=>m.moduleId==="module1")  
        expect(mdleView1).toBeDefined()
        expect(mdleView1.xWorld).toEqual(10)
        expect(mdleView1.yWorld).toEqual(0)

        appStore.selectModule("module0")
        let selected = appStore.getModuleSelected()
        expect(selected.moduleId).toEqual("module0")
        let newPos = plotter.dragSelection( {dx:10,dy:10 }, true)
        expect(newPos.length).toEqual(0)

        expect(document.getElementById("module0")).toBeDefined()

        plotter.highlight(["module1"])
  
        let module1 = document.getElementById("module1")
        expect(module1.classList.contains("highlighted")).toBeTruthy()

        let  t = module0.getAttribute("transform")

        appStore.unselect()
        // next line also close the layer group (only module1 inside) => back to original coors
        appStore.deleteModules([appStore.getModule("module1")])
      })
    plottersObservables.modulesDrawn$.pipe(skip(3),take(1)).subscribe(
      ()=>{
        let module0 = document.getElementById("module0")
        expect(module0).toBeDefined()

        let modulesView = appStore.getActiveModulesView()
        expect(modulesView.length).toEqual(2) 
        let module1 = document.getElementById("module1")
        expect(module1).toEqual(null)
        let grpMdle = document.getElementById("GroupModules_child-layer")
        expect(grpMdle).toBeDefined()
        
        module0 = document.getElementById("module0")
        expect(module0).toBeDefined()
        let transfrom = module0.getAttribute("transform")
        expect(transfrom).toEqual("translate(50,50)")
        done()
      })

    appStore.loadProjectId("simpleProject")
  })


