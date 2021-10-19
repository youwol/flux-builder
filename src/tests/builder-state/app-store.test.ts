import { filter } from 'rxjs/operators'
import  './dependencies'
import { AppDebugEnvironment, AppStore, AppObservables,
  AppBuildViewObservables, UiState } from '../../app/builder-editor/builder-state'
import { environment } from '../common/dependencies'
import { projects } from '../common/projects-data'
import { Component } from '@youwol/flux-core'


test('load empty project', (done) => {

  AppDebugEnvironment.getInstance().debugOn = false

  const appObservables = new AppObservables()
  const appStore : AppStore =new AppStore(environment, appObservables, new AppBuildViewObservables()) 
  appStore.loadProjectId("emptyProject")

  appObservables.ready$.pipe(
    filter( d=> d)
  ).subscribe( ()=>{

    expect(appStore.project.workflow.modules).toHaveLength(1)
    expect(appStore.project.workflow.modules[0]).toBeInstanceOf(Component.Module)
    expect(appStore.project.workflow.connections).toEqual([])
    expect(appStore.project.workflow.plugins).toEqual([])
    expect(appStore.project.builderRendering.modulesView).toEqual([])
    expect(appStore.project.builderRendering.descriptionsBoxes).toEqual([])
    done()
  })
})

test('load simple project', done => {

  AppDebugEnvironment.getInstance().debugOn = false

  const appObservables = new AppObservables()
  const appStore : AppStore =new AppStore(environment, appObservables, new AppBuildViewObservables()) 
  appStore.loadProjectId("simpleProject")
  const projectData = projects.simpleProject

  appObservables.ready$.pipe(
    filter( d=> d)
  ).subscribe( (d)=>{
    expect(appStore.project.workflow.modules).toHaveLength(projectData.workflow.modules.length)
    expect(appStore.project.workflow.connections).toHaveLength(projectData.workflow.connections.length)
    expect(appStore.project.workflow.plugins).toHaveLength(projectData.workflow.plugins.length)

    expect(appStore.project.workflow.modules[0].configuration.title)
    .toEqual(projectData.workflow.modules[0].configuration.title)

    expect(appStore.project.workflow.modules[0].configuration.data.property0)
    .toEqual(projectData.workflow.modules[0].configuration.data.property0)


    //expect(appStore.adaptors.length).toEqual(1)
    //expect(appStore.adaptors[0].adaptorId).toEqual("fake-adaptor")

    const plugins = appStore.getPlugins("module0")
    expect(plugins).toHaveLength(1)
    expect(plugins[0].moduleId).toBe("plugin0")

    done()
  })  
})


test('test UiState', done => {

  AppDebugEnvironment.getInstance().debugOn = false

  const appObservables = new AppObservables()
  const appStore : AppStore =new AppStore(environment, appObservables, new AppBuildViewObservables()) 

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
    const appObservables = AppObservables.getInstance()

    const appStore : AppStore =new AppStore(environment, appObservables, AppBuildViewObservables.getInstance()) 
    
    appObservables.modulesUpdated$.subscribe( ()=>{    
      appStore.saveProject()
      const saved = environment.savedProjects[appStore.projectId]
      expect(saved.requirements).toEqual(projects.simpleProject.requirements)
      expect(saved.builderRendering).toEqual(projects.simpleProject.builderRendering)
      const tutu = projects.simpleProject.workflow
      expect(saved.workflow).toEqual(projects.simpleProject.workflow)
      done()
    })

    appStore.loadProjectId("simpleProject")
  })
  

test('save project 1', done => {

  AppDebugEnvironment.getInstance().debugOn = false
  const appObservables = AppObservables.getInstance()

  const appStore : AppStore =new AppStore(environment, appObservables, AppBuildViewObservables.getInstance()) 
  
  appObservables.modulesUpdated$.subscribe( ()=>{    
    appStore.saveProject()
    const saved = environment.savedProjects[appStore.projectId]
    expect(saved.requirements).toEqual(projects.simpleProjectConnection.requirements)
    expect(saved.builderRendering).toEqual(projects.simpleProjectConnection.builderRendering)
    expect(saved.workflow).toEqual(projects.simpleProjectConnection.workflow)
    done()
  })

  appStore.loadProjectId("simpleProjectConnection")
})

test('selection', (done) => {

  const appObservables = new AppObservables()
  
  const appStore : AppStore =new AppStore(environment, appObservables, AppBuildViewObservables.getInstance()) 
  appObservables.ready$.pipe(
    filter( d=> d)
  ).subscribe( (d)=>{
    let m = appStore.getModuleSelected()
    let c = appStore.getConnectionSelected()
    expect(m).toBeUndefined()
    expect(c).toBeUndefined()
    let ms = appStore.getModulesSelected()
    expect(ms).toHaveLength(0)
    appStore.selectModule("module0")
    m = appStore.getModuleSelected()
    ms = appStore.getModulesSelected()

    expect(m.moduleId).toBe("module0")
    expect(ms.map( m => m.moduleId)).toEqual(["module0"])

    appStore.selectConnection(appStore.project.workflow.connections[0])
    c = appStore.getConnectionSelected() 
    expect(c.end.moduleId).toBe("module0")
    m = appStore.getModuleSelected()
    ms = appStore.getModulesSelected()
    expect(m).toBeUndefined()
    expect(ms).toHaveLength(0)

    appStore.select({modulesId:["module0","module1"], connectionsId:[]})

    expect( appStore.getConnectionSelected() ).toBeUndefined()
    expect( appStore.getModulesSelected() ).toHaveLength(2)

    expect(appStore.isSelected("module1")).toBe(true)
    expect(appStore.isSelected("module-toto")).toBe(false)
    appStore.selectModule("module0")
    expect(appStore.isSelected("module1")).toBe(true)
    expect(appStore.isSelected("module0")).toBe(true)

    const module0 = appStore.getModule("module0")
    expect( module0.moduleId ).toBe("module0")
    const plugin0 = appStore.getModuleOrPlugin("plugin0")
    expect( plugin0.moduleId ).toBe("plugin0")

    const groupModule = appStore.getModule("GroupModules_child-layer")

    expect( groupModule ).toBeTruthy()
    
    appStore.selectActiveGroup("GroupModules_child-layer")
    const activeGroup = appStore.getActiveGroup()
    expect( activeGroup.moduleId ).toBe("GroupModules_child-layer")
    const activeModules = appStore.getActiveModulesId()
    expect( activeModules ).toEqual(["module1"])

    appStore.selectDescriptionBox("descriptionBoxId")
    expect( appStore.descriptionBoxSelected.descriptionBoxId).toBe("descriptionBoxId")
    
    done()
  })

  appStore.loadProjectId("simpleProject")
})

