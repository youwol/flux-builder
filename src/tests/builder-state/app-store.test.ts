import { filter } from 'rxjs/operators'
import  './dependencies'
import { AppDebugEnvironment, AppStore, AppObservables,
  AppBuildViewObservables, UiState } from '../../app/builder-editor/builder-state'
import { environment } from '../common/dependencies'
import { projects } from '../common/projects-data'


test('load empty project', (done) => {

  AppDebugEnvironment.getInstance().debugOn = false

  let appObservables = new AppObservables()
  let appStore : AppStore =new AppStore(environment, appObservables, new AppBuildViewObservables()) 
  appStore.loadProjectId("emptyProject")

  appObservables.ready$.pipe(
    filter( d=> d)
  ).subscribe( ()=>{

    expect(appStore.project.workflow.modules).toEqual([])
    expect(appStore.project.workflow.connections).toEqual([])
    expect(appStore.project.workflow.plugins).toEqual([])
    expect(appStore.project.builderRendering.modulesView).toEqual([])
    expect(appStore.project.builderRendering.descriptionsBoxes).toEqual([])
    expect(appStore.project.runnerRendering.layout).toEqual("")
    expect(appStore.project.runnerRendering.style).toEqual("")
    done()
  })
})

test('load simple project', done => {

  AppDebugEnvironment.getInstance().debugOn = false

  let appObservables = new AppObservables()
  let appStore : AppStore =new AppStore(environment, appObservables, new AppBuildViewObservables()) 
  appStore.loadProjectId("simpleProject")
  let projectData = projects.simpleProject

  appObservables.ready$.pipe(
    filter( d=> d)
  ).subscribe( (d)=>{
    expect(appStore.project.workflow.modules.length).toEqual(projectData.workflow.modules.length)
    expect(appStore.project.workflow.connections.length).toEqual(projectData.workflow.connections.length)
    expect(appStore.project.workflow.plugins.length).toEqual(projectData.workflow.plugins.length)

    expect(appStore.project.workflow.modules[0].configuration.title)
    .toEqual(projectData.workflow.modules[0].configuration.title)

    expect(appStore.project.workflow.modules[0].configuration.data.property0)
    .toEqual(projectData.workflow.modules[0].configuration.data.property0)


    //expect(appStore.adaptors.length).toEqual(1)
    //expect(appStore.adaptors[0].adaptorId).toEqual("fake-adaptor")

    let plugins = appStore.getPlugins("module0")
    expect(plugins.length).toEqual(1)
    expect(plugins[0].moduleId).toEqual("plugin0")

    done()
  })  
})


test('test UiState', done => {

  AppDebugEnvironment.getInstance().debugOn = false

  let appObservables = new AppObservables()
  let appStore : AppStore =new AppStore(environment, appObservables, new AppBuildViewObservables()) 

  appObservables.uiStateUpdated$
  .subscribe( (d)=>{
    expect(d).toEqual(new UiState("Viewer",true,true))
    done()
  })  

  appStore.setUiState(new UiState("Viewer",true,true))  
  expect(appStore.uiState).toEqual(new UiState("Viewer",true,true))
})


test('save project 0', done => {

    AppDebugEnvironment.getInstance().debugOn = false
    let appObservables = AppObservables.getInstance()
    
    /*
    backend.onSavedProject = ( p)=> {
      expect(p).toEqual(projects.simpleProject)
      done()
    }*/

    let appStore : AppStore =new AppStore(environment, appObservables, AppBuildViewObservables.getInstance()) 
    
    appObservables.modulesUpdated$.subscribe( ()=>{    
      appStore.saveProject()
      let saved = environment.savedProjects[appStore.projectId]
      expect(saved.requirements).toEqual(projects.simpleProject.requirements)
      expect(saved.builderRendering).toEqual(projects.simpleProject.builderRendering)
      expect(saved.runnerRendering).toEqual(projects.simpleProject.runnerRendering)
      expect(saved.workflow).toEqual(projects.simpleProject.workflow)
      done()
    })

    appStore.loadProjectId("simpleProject")
  })
  
  
test('save project 1', done => {

  AppDebugEnvironment.getInstance().debugOn = false
  let appObservables = AppObservables.getInstance()

  let appStore : AppStore =new AppStore(environment, appObservables, AppBuildViewObservables.getInstance()) 
  
  appObservables.modulesUpdated$.subscribe( ()=>{    
    appStore.saveProject()
    let saved = environment.savedProjects[appStore.projectId]
    expect(saved.requirements).toEqual(projects.simpleProjectConnection.requirements)
    expect(saved.builderRendering).toEqual(projects.simpleProjectConnection.builderRendering)
    expect(saved.runnerRendering).toEqual(projects.simpleProjectConnection.runnerRendering)
    expect(saved.workflow).toEqual(projects.simpleProjectConnection.workflow)
    done()
  })

  appStore.loadProjectId("simpleProjectConnection")
})

test('selection', (done) => {

  let appObservables = new AppObservables()
  
  let appStore : AppStore =new AppStore(environment, appObservables, AppBuildViewObservables.getInstance()) 
  appObservables.ready$.pipe(
    filter( d=> d)
  ).subscribe( (d)=>{
    let m = appStore.getModuleSelected()
    let c = appStore.getConnectionSelected()
    expect(m).toEqual(undefined)
    expect(c).toEqual(undefined)
    let ms = appStore.getModulesSelected()
    expect(ms.length).toEqual(0)
    appStore.selectModule("module0")
    m = appStore.getModuleSelected()
    ms = appStore.getModulesSelected()

    expect(m.moduleId).toEqual("module0")
    expect(ms.map( m => m.moduleId)).toEqual(["module0"])

    appStore.selectConnection(appStore.project.workflow.connections[0])
    c = appStore.getConnectionSelected() 
    expect(c.end.moduleId).toEqual("module0")
    m = appStore.getModuleSelected()
    ms = appStore.getModulesSelected()
    expect(m).toEqual(undefined)
    expect(ms.length).toEqual(0)

    appStore.select({modulesId:["module0","module1"], connectionsId:[]})

    expect( appStore.getConnectionSelected() ).toEqual(undefined)
    expect( appStore.getModulesSelected().length ).toEqual(2)

    expect(appStore.isSelected("module1")).toEqual(true)
    expect(appStore.isSelected("module-toto")).toEqual(false)
    appStore.selectModule("module0")
    expect(appStore.isSelected("module1")).toEqual(true)
    expect(appStore.isSelected("module0")).toEqual(true)

    let module0 = appStore.getModule("module0")
    expect( module0.moduleId ).toEqual("module0")
    let plugin0 = appStore.getModuleOrPlugin("plugin0")
    expect( plugin0.moduleId ).toEqual("plugin0")

    let groupModule = appStore.getModule("GroupModules_child-layer")

    expect( groupModule["layerId"] ).toEqual("child-layer")
    
    appStore.selectActiveLayer("child-layer")
    let activeLayer = appStore.getActiveLayer()
    expect( activeLayer.layerId ).toEqual("child-layer")
    let activeModules = appStore.getActiveModulesId()
    expect( activeModules ).toEqual(["module1"/*,"plugin0"*/])

    appStore.selectDescriptionBox("descriptionBoxId")
    expect( appStore.descriptionBoxSelected.descriptionBoxId).toEqual("descriptionBoxId")
    
    //appStore.applyLayout()
    appStore.applyStyle()
    appStore.addModuleRenderDiv("")
    done()
  })

  appStore.loadProjectId("simpleProject")
})


test('deletion', (done) => {

  let appObservables = new AppObservables()
  
  let appStore : AppStore =new AppStore(environment, appObservables, AppBuildViewObservables.getInstance()) 
  appStore.loadProjectId("simpleProject")
  appObservables.ready$.pipe(
    filter( d=> d)
  ).subscribe( (d)=>{

    expect(appStore.project.workflow.connections.length).toEqual(2)
    appStore.selectConnection(appStore.project.workflow.connections[0])
    appStore.deleteSelected()
    expect(appStore.project.workflow.connections.length).toEqual(1)
    appStore.undo()
    expect(appStore.project.workflow.connections.length).toEqual(2)

    expect(appStore.project.workflow.modules.length).toEqual(3)
    appStore.selectModule("module0")
    appStore.deleteSelected()
    expect(appStore.project.workflow.modules.length).toEqual(2)
    appStore.undo()
    expect(appStore.project.workflow.modules.length).toEqual(3)

    expect(appStore.project.builderRendering.descriptionsBoxes.length).toEqual(1)
    appStore.selectDescriptionBox("descriptionBoxId")
    appStore.deleteSelected()
    expect(appStore.project.builderRendering.descriptionsBoxes.length).toEqual(0)
    appStore.undo()
    expect(appStore.project.builderRendering.descriptionsBoxes.length).toEqual(1)

    done()
  })
})
