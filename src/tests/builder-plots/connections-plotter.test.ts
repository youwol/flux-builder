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
    const connectionsPlotter = new ConnectionsPlotter(drawingArea, plottersObservables,appObservables,appStore)    

    plottersObservables.modulesDrawn$.pipe(skip(1),take(1)).subscribe( ()=>{

      const modules = document.querySelectorAll("g.module.entity")
      expect(modules.length).toEqual(4)
      expect(modules[0].id).toEqual("module0")
      expect(modules[1].id).toEqual("module2")
      expect(modules[2].id).toEqual("module3")
      expect(modules[3].id).toEqual("GroupModules_child-layer")
    })

    plottersObservables.connectionsDrawn$.pipe(take(1)).subscribe( ()=>{

      const connections = document.querySelectorAll("g.connection.entity")
      expect(connections.length).toEqual(4)
      expect(connections[0].id).toEqual("output0@module1-input0@module0")
      expect(connections[1].id).toEqual("output0@module1-input0-plugin@plugin0")
      expect(connections[2].id).toEqual("output0@module2-input0@module0")

      const slots = document.querySelectorAll(".slot")
      const slotsId = []
      for(let i=0;i<slots.length;i++)
        {slotsId.push(slots[i].id)}
    
      expect(slotsId.includes("input-slot_input0_module0")).toBeTruthy()
      expect(slotsId.includes("output-slot_output0_module0")).toBeTruthy()
      expect(slotsId.includes("input-slot_input0-plugin_plugin0")).toBeTruthy()
      expect(slotsId.includes("input-slot_input0_module2")).toBeTruthy()
      expect(slotsId.includes("output-slot_output0_module2")).toBeTruthy()
      expect(slotsId.includes("input-slot_input0_module3")).toBeTruthy()
      expect(slotsId.includes("output-slot_output0_module3")).toBeTruthy()
      expect(slotsId.includes("output-slot_output0_module1")).toBeTruthy()
    
      const module = document.getElementById("module0")
      let event = new MouseEvent('click',{button:0})
      module.dispatchEvent(event)

      const slot =  document.getElementById("input-slot_input0_module0")
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
        const drawing_connection = document.getElementById("drawing-connection")
        expect(drawing_connection).toBeDefined()
        const x1 = drawing_connection.getAttribute("x1")
        const y1 = drawing_connection.getAttribute("y1")
        const x2 = drawing_connection.getAttribute("x2")
        const y2 = drawing_connection.getAttribute("y2")
        expect(x1).toEqual("-40")
        expect(y1).toEqual("50")
        expect(x2).toEqual("-1")
        expect(y2).toEqual("-1")

        const slot =  document.getElementById("output-slot_output0_module3")
        slot.onclick = (event)=>{
                              
          plottersObservables.plugOutputClicked$.next(
              { event,
                group: document.getElementById("module3"),
                moduleId:"module3"})
        }
      
      const event = new MouseEvent('click',{button:0})
      slot.dispatchEvent(event)
    })
    plottersObservables.plugOutputClicked$.pipe(take(1)).subscribe( () =>{
        
      const connections = document.querySelectorAll("g.connection.entity")
      expect(connections.length).toEqual(5) 
      const newConnection = document.getElementById("output0@module3-input0@module0")
      const event = new MouseEvent('click',{button:0})
      newConnection.dispatchEvent(event)

      expect(newConnection.classList.contains("selected")).toBeTruthy()
      done()
    })

    appStore.loadProjectId("simpleProjectConnection")
  })


