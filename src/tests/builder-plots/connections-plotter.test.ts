import '../common/dependencies'
import { createDrawingArea } from '@youwol/flux-svg-plots'
import { AppObservables, AppDebugEnvironment, AppStore, AppBuildViewObservables } from '../../app/builder-editor/builder-state/index'
import { ModulesPlotter,ConnectionsPlotter } from '../../app/builder-editor/builder-plots/index'
import { take, skip } from 'rxjs/operators'
import { environment } from '../common/dependencies'


/*
Need additional tests on grouped modules & connections
*/
test('load simple project and test connections plot', (done) => {
    
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
    let connectionsPlotter = new ConnectionsPlotter(drawingArea, plottersObservables,appObservables,appStore)    

    plottersObservables.modulesDrawn$.pipe(skip(1),take(1)).subscribe( ()=>{

      let modules = document.querySelectorAll("g.module.entity")
      expect(modules.length).toEqual(4)
      expect(modules[0].id).toEqual("module0")
      expect(modules[1].id).toEqual("module2")
      expect(modules[2].id).toEqual("module3")
      expect(modules[3].id).toEqual("GroupModules_child-layer")
    })

    plottersObservables.connectionsDrawn$.pipe(take(1)).subscribe( ()=>{

      let connections = document.querySelectorAll("g.connection.entity")
      expect(connections.length).toEqual(4)
      expect(connections[0].id).toEqual("output0@module1-input0@module0")
      expect(connections[1].id).toEqual("output0@module1-input0-plugin@plugin0")
      expect(connections[2].id).toEqual("output0@module2-input0@module0")

      let slots = document.querySelectorAll(".slot")
      let slotsId = []
      for(let i=0;i<slots.length;i++)
        slotsId.push(slots[i].id)
    
      expect(slotsId.includes("input-slot_input0_module0")).toBeTruthy()
      expect(slotsId.includes("output-slot_output0_module0")).toBeTruthy()
      expect(slotsId.includes("input-slot_input0-plugin_plugin0")).toBeTruthy()
      expect(slotsId.includes("input-slot_input0_module2")).toBeTruthy()
      expect(slotsId.includes("output-slot_output0_module2")).toBeTruthy()
      expect(slotsId.includes("input-slot_input0_module3")).toBeTruthy()
      expect(slotsId.includes("output-slot_output0_module3")).toBeTruthy()
      expect(slotsId.includes("output-slot_output0_module1")).toBeTruthy()
    
      let module = document.getElementById("module0")
      let event = new MouseEvent('click',{button:0})
      module.dispatchEvent(event)

      let slot =  document.getElementById("input-slot_input0_module0")
      slot.onclick = (event)=>{
                              
          plottersObservables.plugInputClicked$.next(
              { event,
                group: document.getElementById("module0"),
                moduleId:"module0"})
      }
      
      event = new MouseEvent('click',{button:0})
      slot.dispatchEvent(event)
    
    })  
    plottersObservables.plugInputClicked$.pipe(take(1)).subscribe( () =>{

        plottersObservables.mouseMoved$.next( [0,0])
        let drawing_connection = document.getElementById("drawing-connection")
        expect(drawing_connection).toBeDefined()
        let x1 = drawing_connection.getAttribute("x1")
        let y1 = drawing_connection.getAttribute("y1")
        let x2 = drawing_connection.getAttribute("x2")
        let y2 = drawing_connection.getAttribute("y2")
        expect(x1).toEqual("-40")
        expect(y1).toEqual("50")
        expect(x2).toEqual("-1")
        expect(y2).toEqual("-1")

        let slot =  document.getElementById("output-slot_output0_module3")
        slot.onclick = (event)=>{
                              
          plottersObservables.plugOutputClicked$.next(
              { event,
                group: document.getElementById("module3"),
                moduleId:"module3"})
        }
      
      let event = new MouseEvent('click',{button:0})
      slot.dispatchEvent(event)
    })
    plottersObservables.plugOutputClicked$.pipe(take(1)).subscribe( () =>{
        
      let connections = document.querySelectorAll("g.connection.entity")
      expect(connections.length).toEqual(5) 
      let newConnection = document.getElementById("output0@module3-input0@module0")
      let event = new MouseEvent('click',{button:0})
      newConnection.dispatchEvent(event)

      expect(newConnection.classList.contains("selected")).toBeTruthy()
      done()
    })

    appStore.loadProject("simpleProjectConnection")
  })


