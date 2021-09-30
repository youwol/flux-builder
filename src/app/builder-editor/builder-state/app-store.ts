
import {Requirements, 
    Project,Workflow,BuilderRendering,RunnerRendering,
    Component, Connection, ModuleFlux, PluginFlux,  ModuleConfiguration, 
    DescriptionBox, LayerTree, instanceOfSideEffects, 
    GroupModules, DescriptionBoxProperties,  FluxExtensionAPIs, loadProjectDatabase$, loadProjectURI$, ProjectSchema, IEnvironment, loadProjectDependencies$, createProject } from '@youwol/flux-core';

import { AppObservables } from './app-observables.service';
import { AppDebugEnvironment,LogLevel } from './app-debug.environment';
import { AppBuildViewObservables } from './observables-plotters';
import { AppExtensionsObservables } from './app-extensions-observables.service';
import { toProjectData, toProjectURI } from './factory-utils';

import { addModule,updateModule, moveModules,deleteModules, duplicateModules, alignH, alignV } from './app-store-modules';
import { getAvailablePlugins, getPlugins, addPlugin } from './app-store-plugins';
import { addConnection , deleteConnection, addAdaptor, 
    deleteAdaptor, updateAdaptor, subscribeConnections, setConnectionView} from './app-store-connections';
    
import { addDescriptionBox, updateDescriptionBox, deleteDescriptionBox } from './app-store-description-box';
import { setRenderingStyle, setRenderingLayout } from './app-store-runner-rendering';
import { applyHtmlLayout, createLayer, getLayer } from './app-store-layer';
import { getDisplayedModulesView } from './app-store-modules-group';
import { filter, mergeMap,map, tap } from 'rxjs/operators';
import {  getDelta, workflowDelta } from './project-delta';
import * as _ from 'lodash'
import { uuidv4, packageAssetComponent, plugBuilderViewsSignals } from './utils';
import { BuilderStateAPI } from './extension';
import { addLibraries, cleanUnusedLibraries } from './app-store-dependencies';
import { Observable } from 'rxjs';
import { CdnEvent } from '@youwol/cdn-client';


export class UiState{
    constructor(
        public readonly mode : string,
        public readonly rendererEditorsVisible: boolean,
        public readonly isEditing : boolean) {

    }
}

export interface BackendInterface{
    getAdaptors()
    getProject(id:string)
    postProject(id:string,body:Object)
    postAdaptor(body:Object)
}

export class AppStore {
    

    private static instance : AppStore = undefined

    static getInstance(environment: IEnvironment) {
        if(!AppStore.instance)
            AppStore.instance =  new AppStore(
                environment,
                AppObservables.getInstance(),
                AppBuildViewObservables.getInstance()
            )
        return AppStore.instance
    }
    debugSingleton = AppDebugEnvironment.getInstance()

    builderViewsActions = {
        configurationUpdated: (data) => this.updateModule(data.module,data.configuration)
    }
    allSubscriptions = new Map<Connection,any>()

    projectId = undefined
    project   = new Project({
        name:"new project", 
        schemaVersion:"1.0",
        description: "",
        requirements: new Requirements([],[],{},{}),
        workflow: new Workflow({
            modules:[],
            connections:[],
            plugins:[]
        }),
        builderRendering: new BuilderRendering([],[],[]), 
        runnerRendering: new RunnerRendering("","") 
    })
    rootLayerId = 'Component_root-component'
    activeLayerId   : string = this.rootLayerId
    adaptors        = [] 
    history         = new Array<Project>(this.project)
    indexHistory    = 0
    uiState         = new UiState( "combined", false,false)

    modulesFactory : Map<string, any> 
    pluginsFactory : Map<string,any> 
    packages        = []

    implicitModules         : Array<ModuleFlux> = []
    moduleSelected          : ModuleFlux = undefined
    modulesSelected         : Array<ModuleFlux> = []
    connectionSelected      : Connection =undefined
    descriptionBoxSelected  : DescriptionBox =undefined

    appExtensionsObservables : AppExtensionsObservables = AppExtensionsObservables.getInstance()

    constructor(
        public readonly environment: IEnvironment, 
        public appObservables : AppObservables,
        public appBuildViewObservables: AppBuildViewObservables,
        ){  
            this.environment = environment

            this.debugSingleton.logWorkflowBuilder( {  
                    level : LogLevel.Info, 
                    message: "AppStore constructed", 
                    object:{ appStore:this }
            })

            GroupModules['BuilderView'].notifier$.pipe( filter((event:any)=>event.type=="layerFocused")).subscribe( d=>
                this.selectActiveLayer(d.data))     
            Component['BuilderView'].notifier$.pipe( filter((event:any)=>event.type=="layerFocused")).subscribe( d=>
                this.selectActiveLayer(d.data))  
            GroupModules['BuilderView'].notifier$.pipe( filter((event:any)=>event.type=="closeLayer")).subscribe( d=>
                this.selectActiveLayer(this.getParentLayer(d.data).moduleId ))  
            Component['BuilderView'].notifier$.pipe( filter((event:any)=>event.type=="closeLayer")).subscribe( d=>
                this.selectActiveLayer(this.getParentLayer(d.data).moduleId ))  
            this.appObservables.renderingLoaded$.next( { style: "", layout:"", cssLinks: [] } )
    }

    setUiState(state){
        this.debugSingleton.debugOn && 
        this.debugSingleton.logWorkflowBuilder( {  
                level : LogLevel.Info, 
                message: "ui state updated", 
                object:{ state:state }
        })

        this.uiState = state
        this.appObservables.uiStateUpdated$.next(this.uiState)
    }

    loadProject(projectId: string, project: ProjectSchema, onEvent? : (CdnEvent) => void){
        
        this.projectId = projectId
        let project$ = loadProjectDependencies$(project, this.environment, onEvent).pipe(
            map( ({ project, packages }) => {
                return createProject(project, packages,  () =>this.project.workflow,this.allSubscriptions, this.environment)
            })
        )
        
        this.initializeProject(project$)
    }

    loadProjectId(projectId: string){
        
        this.projectId = projectId

        let project$ = loadProjectDatabase$(projectId, () =>this.project.workflow,this.allSubscriptions, this.environment)
        this.initializeProject(project$)
    }

    loadProjectURI(projectURI: string){
        
        this.projectId = undefined
        let project$ = loadProjectURI$(projectURI, () =>this.project.workflow,this.allSubscriptions, this.environment)
        this.initializeProject(project$)
    }
    
    initializeProject( project$ : Observable<{project:Project, packages: Array<any>}>){
        project$.subscribe( ({project, packages}: {project:Project, packages: Array<any>}) => {

            this.appObservables.packagesUpdated$.next(packages);
            let rootComponent = project.workflow.modules.find( mdle => mdle.moduleId == this.rootLayerId ) as Component.Module
            this.activeLayerId = rootComponent.moduleId

            this.debugSingleton.debugOn &&
            this.debugSingleton.logWorkflowBuilder( {  
                level : LogLevel.Info, 
                message: "project created", 
                object:{ project: this.project }
            })
            this.updateProject(project)

            this.loadExtensions()

            this.appObservables.ready$.next(true)
            this.appObservables.packagesLoaded$.next();
            this.appObservables.uiStateUpdated$.next(this.uiState)

            let layout = rootComponent.getHTML({recursive:true})
            let style = rootComponent.getCSS({recursive: true, asString: true})
            this.appObservables.renderingLoaded$.next( { 
                style, 
                layout,
                cssLinks: [] 
            })
        })
    }

    loadExtensions(){
        // this test is for backward compatibility w/ flux-lib-core
        if(!FluxExtensionAPIs)
            return
        BuilderStateAPI.initialize(this)
        FluxExtensionAPIs.registerAPI('BuilderState', BuilderStateAPI)
    }

    addLibraries$( libraries: Array<{name: string, version: string, namespace: string}>,
                   fluxPacks: Array<{name:string}>){

        return addLibraries(libraries, fluxPacks, this.project, this.environment ).pipe(
            tap( (newProject) => {
                this.updateProject(newProject)
            })
        )
    }    

    projectSchema$(): Observable<ProjectSchema>{
        return cleanUnusedLibraries(this.project, this.environment).pipe(
            map( project => toProjectData(project))
        )
    }

    projectURI$(): Observable<string>{
        return this.projectSchema$().pipe(
            map( project => {
                return `/ui/flux-builder/?uri=${toProjectURI(project)}`
            })
        )
    }

    saveProject(){
        this.projectSchema$().pipe(
            mergeMap( body => 
                this.environment.postProject(this.projectId, body).pipe(
                    map( () => body)
                ))  
        )
        .subscribe( (body) => {
            this.debugSingleton.debugOn && 
            this.debugSingleton.logWorkflowBuilder( {  
                level : LogLevel.Info, 
                message: "project saved",
                object:{ body, project: this.project } 
            }) 
        })        
    }

    getModulesFactory(){
        return this.packages
        .map( p => Object.entries(p.modules).map( ([_,mdle]:[any,any]) => [ `${mdle.id}@${p.id}`, mdle]))
        .reduce( (acc,e) => acc.concat(e), [] )
        .reduce( (acc,e:[string,any]) => _.merge( acc, { [e[0]]:e[1] }), {} )
    }

    getAvailablePlugins( mdle ) {
        return getAvailablePlugins( mdle , this.pluginsFactory )
    }

    getPlugins( moduleId ) : Array<PluginFlux<any>> {
        return getPlugins(moduleId,this.project)
    }

    addPlugin( Factory, parentModule ) : ModuleFlux {
        let project = addPlugin(Factory, parentModule,this.project, this.appObservables.ready$, this.environment)
        this.updateProject(project)
        return  project.workflow.plugins.slice(-1)[0]
    }

    addModule( moduleFactory, coors = [0,0] ) : ModuleFlux{

        let project = addModule( moduleFactory, coors, this.project , this.activeLayerId,this.appObservables.ready$, this.environment)
        this.updateProject(project)
        return project.workflow.modules.slice(-1)[0]
    }

    updateModule(mdle:ModuleFlux, configuration: ModuleConfiguration, unselect = true) {
        
        let project = updateModule(mdle,configuration, this.project,this.allSubscriptions,this.appObservables.ready$)
        if(unselect)
            this.unselect()
        this.updateProject(project)
    }

    duplicateModules( modules : Array<ModuleFlux>) {

        let project = duplicateModules(modules, this.project, this.appObservables.ready$ )
        this.updateProject(project)
    }

    alignH( modules : Array<ModuleFlux>) {

        let project = alignH(modules.map(m=>m.moduleId), this.project, this.appObservables.ready$ )
        this.updateProject(project)
    } 

    alignV( modules : Array<ModuleFlux>) {

        let project = alignV(modules.map(m=>m.moduleId), this.project, this.appObservables.ready$ )
        this.updateProject(project)
    }

    moveModules( modulesPosition ){
        modulesPosition = modulesPosition.filter( m => this.getActiveLayer().getModuleIds().includes(m.moduleId) )
        let project = moveModules(modulesPosition,this.project.builderRendering.modulesView, this.project,this.implicitModules)
        this.updateProject(project)
    }

    getModuleSelected(): ModuleFlux{
        if(this.moduleSelected )
            return this.moduleSelected 
        if(this.modulesSelected.length == 1)
            return this.modulesSelected[0]
        return undefined
    }

    getModulesSelected(): Array<ModuleFlux>{
        if(this.moduleSelected )
            return [this.moduleSelected]
        if(this.modulesSelected.length > 0)
            return this.modulesSelected

        return []
    }

    isSelected(moduleId:string){

        if(this.moduleSelected && this.moduleSelected.moduleId === moduleId)
            return true
        
        if(this.modulesSelected && this.modulesSelected.find( m => m.moduleId === moduleId) )
            return true

        return false
    }

    selectModule(moduleId:string){
        
        if(  this.modulesSelected.find(m => m.moduleId == moduleId) || 
            (this.moduleSelected && this.moduleSelected.moduleId == moduleId ) )
            return 

        if( this.moduleSelected && this.moduleSelected.moduleId != moduleId ){
            this.appObservables.modulesUnselected$.next( [this.moduleSelected] )
            this.moduleSelected = undefined
        }
        
        if( !this.modulesSelected.find(m => m.moduleId == moduleId) ){
            this.appObservables.modulesUnselected$.next( this.modulesSelected )
            this.modulesSelected  = []
        }
        
        this.moduleSelected = this.getModule(moduleId)
        this.debugSingleton.debugOn && 
        this.debugSingleton.logWorkflowBuilder( {  
            level : LogLevel.Info, 
            message: "module selected", 
            object:{    module: this.moduleSelected
            }
        })
        this.appObservables.moduleSelected$.next(this.moduleSelected )
    }

    selectConnection(connection: Connection | string){

        this.unselect()
        this.connectionSelected = connection instanceof Connection
            ? connection
            : this.getConnection(connection)
        this.debugSingleton.debugOn && 
        this.debugSingleton.logWorkflowBuilder( {  
            level : LogLevel.Info, 
            message: "connection selected", 
            object:{    module: this.connectionSelected
            }
        })
        this.appObservables.connectionSelected$.next(this.connectionSelected )
        let moduleFrom = this.getModule(this.connectionSelected.start.moduleId)
        let moduleTo = this.getModule(this.connectionSelected.end.moduleId)
        let suggestions = this.adaptors.filter( a =>
            a.fromModuleFactoryId === moduleFrom["factoryId"] &&
            a.toModuleFactoryId   === moduleTo["factoryId"] &&
            a.fromModuleSlotId === this.connectionSelected.start.slotId &&
            a.toModuleSlotId === this.connectionSelected.end.slotId)
        if(!this.connectionSelected.adaptor)
            this.appObservables.suggestions$.next(suggestions)
    }

    select( {modulesId,connectionsId}: {modulesId:Array<String>, connectionsId:Array<Connection>}){

        this.unselect()
        this.modulesSelected= this.project.workflow.modules.filter(m=>modulesId.includes(m.moduleId))
        this.modulesSelected.forEach( m => this.appObservables.moduleSelected$.next(m))
    }

    getModuleOrPlugin(moduleId:string):ModuleFlux{
        let allModules= this.getModulesAndPlugins()
        let m = allModules.find( m => m.moduleId === moduleId)
        return m
    }

    getModule(moduleId:string):ModuleFlux{

        let m = this.getModulesAndPlugins().find( m => m.moduleId === moduleId)
        if(m)
            return m
        m = this.implicitModules.find( m => m.moduleId === moduleId)
        return m
    }
    
    deleteModules(modulesDeleted:Array<ModuleFlux>){
        
        this.unselect()
        let project = deleteModules(modulesDeleted,this.project)
        if(!project)
            return 
        let rootComponent = this.getModule(this.rootLayerId) as Component.Module
        
        if(!getLayer(rootComponent, rootComponent, this.activeLayerId)){
            // if the group has been deleted => we focus on the root-component
            let oldLayer = this.activeLayerId
            this.activeLayerId = this.rootLayerId
            this.updateProject(project)            
            this.appObservables.activeLayerUpdated$.next({fromLayerId:oldLayer, toLayerId: this.activeLayerId})
            return
        }
        this.updateProject(project)            
    }
        
    deleteModule(mdle:ModuleFlux){
        
        if(mdle==this.moduleSelected)
            this.unselect()
        this.deleteModules([mdle])
    }

    getActiveLayer() : GroupModules.Module{
        return getLayer(undefined, this.getModule(this.rootLayerId) as Component.Module, this.activeLayerId)[0]
    }

    getRootLayer() :  Component.Module{ 
        return getLayer(undefined, this.getModule(this.rootLayerId) as Component.Module, this.rootLayerId)[0] as Component.Module
    }

    getLayer(layerId) : GroupModules.Module{
        let a =  getLayer(undefined, this.getModule(this.rootLayerId) as Component.Module, layerId)
        if(a==undefined){
            console.error("Can not find layer ",layerId)
            return undefined
        }
        return a[0]
    }

    getParentLayer(layerId) : GroupModules.Module{
        return getLayer(undefined, this.getModule(this.rootLayerId) as Component.Module, layerId)[1]
    }

    selectActiveLayer(layerId) {
        this.debugSingleton.debugOn && 
        this.debugSingleton.logWorkflowBuilder( {  
            level : LogLevel.Info, 
            message: "selectActiveLayer", 
            object:{    
                layerId: layerId
            }
        })
        if(this.activeLayerId == layerId)
            return
        let oldLayerId = this.activeLayerId
        this.activeLayerId = layerId
        this.appBuildViewObservables.modulesViewUpdated$.next(this.getActiveModulesView()) 
        this.appObservables.descriptionsBoxesUpdated$.next(this.project.builderRendering.descriptionsBoxes) 
        this.appObservables.activeLayerUpdated$.next({fromLayerId:oldLayerId, toLayerId:layerId})
        //this.addDescriptionBox(descriptionBox)
    }

    getActiveModulesId(){
        return this.getLayer(this.activeLayerId).getModuleIds()
    }

    getActiveModulesView(){
        //deprecated, use getDisplayedModulesView, need to remove from tests
        const displayed = this.getDisplayedModulesView()
        return [...displayed.currentLayer.modulesView, ...displayed.parentLayer.modulesView]
    }
    
    getDisplayedModulesView(){
        
        let [activeGroup, parentGroup] = getLayer(undefined, this.getModule(this.rootLayerId) as Component.Module, this.activeLayerId)
        return getDisplayedModulesView(activeGroup,parentGroup,this,this.project)
    }

    getGroupModule(layerId:string): GroupModules.Module{
        return this.project.workflow.modules
        .find( m => m instanceof GroupModules.Module && m.moduleId == layerId) as GroupModules.Module
    }

    getParentGroupModule(moduleId:string): GroupModules.Module{

        let mdle = this.getModule(moduleId)
        if( this.project.workflow.plugins.map(plugin=>plugin.moduleId).includes(mdle.moduleId))
            mdle = (mdle as PluginFlux<any>).parentModule

        return this.project.workflow.modules
            .filter( mdle => mdle instanceof GroupModules.Module)
            .find( (grp: GroupModules.Module) => grp.getModuleIds().includes(mdle.moduleId)) as GroupModules.Module
    }

    getChildrenRecursive(layerId) : ModuleFlux[] {
        let layer = this.getLayer(layerId)
        let all = layer.getAllChildren()
        return all
    }

    getModulesAndPlugins(): Array<ModuleFlux>{
        return this.project.workflow.modules.concat(this.project.workflow.plugins)
    }

    addRemoteComponent(componentId: string, [x,y] : [number, number]){
        /*Backend.getComponent(componentId).subscribe( component=> {
            let project = addRemoteComponent(component, this.modulesFactory,[x,y],this.project, this.activeLayerId,
                (_)=>this.project.workflow, this.appObservables.ready$, this.environment) 
            console.log("New project!", project)
            this.updateProject(project)
            }
        )
        */
    }
    
    getConnection(connectionId:string):Connection{

        let c = this.project.workflow.connections.find( c => c.connectionId === connectionId)
        return c
    }
    
    addConnection( connection: Connection ){
        let project = addConnection(connection, this.project, this.allSubscriptions)
        
        this.updateProject(project)
        this.unselect()
        this.appObservables.connectionsUpdated$.next(this.project.workflow.connections)
    }

    setConnectionView(connection: Connection, properties, unselect = true ){
        let project = setConnectionView(connection, properties, this.project)
        this.updateProject(project)
        if(unselect)
            this.unselect()
        this.appObservables.connectionsUpdated$.next(this.project.workflow.connections)
    }

    getConnectionSelected(){
        return this.connectionSelected
    }

    getConnectionView(connectionId:string){
        return this.project.builderRendering.connectionsView.find( c=>c.connectionId == connectionId)
    }

    deleteConnection(connection : Connection) {
        
        if( this.connectionSelected=== connection){
            this.connectionSelected = undefined
            this.appObservables.unselect$.next()
        }
        let project = deleteConnection(connection,this.project, this.allSubscriptions)        
        this.updateProject(project)
        this.appObservables.connectionsUpdated$.next(this.project.workflow.connections)
    }

    addAdaptor(adaptor, connection : Connection){

        let project = addAdaptor(connection, adaptor, this.project, this.allSubscriptions)
        this.updateProject(project)
        this.appObservables.connectionsUpdated$.next(this.project.workflow.connections)
    }

    deleteAdaptor(connection : Connection){

        let project = deleteAdaptor(connection, this.project, this.allSubscriptions)
        this.updateProject(project)
        this.appObservables.connectionsUpdated$.next(this.project.workflow.connections)
    }

    publishAdaptor(connection : Connection){
        
        /*this.environment.backend.postAdaptor({
            adaptorId:connection.adaptor.adaptorId,
            fromModuleFactoryId: this.getModule(connection.start.moduleId)["factoryId"],
            toModuleFactoryId: this.getModule(connection.end.moduleId)["factoryId"],
            fromModuleSlotId:connection.start.slotId,
            toModuleSlotId:connection.end.slotId,
            configuration:connection.adaptor.configuration
            }).subscribe(()=> console.log("adaptor published"))
            */
    }

    updateAdaptor(connection : Connection, mappingFunction: string ){
        let project = updateAdaptor(connection, mappingFunction, this.project, this.allSubscriptions)
        this.updateProject(project)
        this.appObservables.connectionsUpdated$.next(this.project.workflow.connections)
    }

    unselect(){
        this.modulesSelected = []
        this.moduleSelected = undefined
        this.connectionSelected =undefined
        this.descriptionBoxSelected =undefined
        this.appObservables.unselect$.next()
        this.appObservables.suggestions$.next([])
    }
    deleteSelected(){
        if(this.uiState.isEditing)
            return 
            
        this.debugSingleton.debugOn && 
        this.debugSingleton.logWorkflowBuilder( {  
            level : LogLevel.Info, 
            message: "delete selected", 
            object:{    connectionSelected: this.connectionSelected,
                moduleSelected:this.moduleSelected,
                modulesSelected:this.modulesSelected,
                descriptionBoxSelected:this.descriptionBoxSelected
            }
        })
        if(this.connectionSelected){
            this.deleteConnection(this.connectionSelected)
        }
        if(this.moduleSelected){
            this.deleteModule(this.moduleSelected)
        }
        if(this.modulesSelected && this.modulesSelected.length>0){
            this.deleteModules(this.modulesSelected)
        }
        if(this.descriptionBoxSelected){
            this.deleteDescriptionBox(this.descriptionBoxSelected)
        }
        this.appObservables.suggestions$.next([])
    }

    addDescriptionBox(descriptionBox : DescriptionBox){
        
        let project = addDescriptionBox(descriptionBox,this.project)
        this.updateProject(project)
        this.appObservables.descriptionsBoxesUpdated$.next(this.project.builderRendering.descriptionsBoxes)
    }

    selectDescriptionBox(descriptionBoxId){
        this.unselect()
        this.descriptionBoxSelected = this.project.builderRendering.descriptionsBoxes.find(
            b => b.descriptionBoxId == descriptionBoxId
        )
        this.appObservables.descriptionsBoxesUpdated$.next(this.project.builderRendering.descriptionsBoxes)
    
    }
    deleteDescriptionBox(descriptionBox){
        if(descriptionBox==this.descriptionBoxSelected)
            this.unselect()
        let project = deleteDescriptionBox(descriptionBox,this.project)
        this.updateProject(project)

        this.appObservables.descriptionsBoxesUpdated$.next(this.project.builderRendering.descriptionsBoxes)
    }

    addGroup( moduleIds : Array<string> ){
        let dBox = new DescriptionBox(uuidv4(),"grouped module",moduleIds,"",new DescriptionBoxProperties(undefined))
        let config = new GroupModules["Configuration"]({title:dBox.title})
        let {project} = createLayer(dBox.title,dBox.modulesId.map(mid=>this.getModule(mid)), this.project,
            this.activeLayerId, GroupModules,config, (_)=> this.project.workflow, this.environment)
        this.updateProject(project)
    }

    addComponent( moduleIds : Array<string> ){
        let dBox = new DescriptionBox(uuidv4(),"component",moduleIds,"",new DescriptionBoxProperties(undefined))
        let config = new Component["Configuration"]({title:dBox.title})
        let {project} = createLayer(dBox.title,dBox.modulesId.map(mid=>this.getModule(mid)),this.project,
            this.activeLayerId, Component, config, (_)=> this.project.workflow, this.environment)
        this.updateProject(project)
    }

    publishComponent(component: Component.Module){
        
        let data = packageAssetComponent(component, this.project)
        sessionStorage.setItem( component.moduleId, JSON.stringify(data))
        window.open("/ui/assets-publish-ui?kind=flux-component&related_id="+ component.moduleId, '_blank');
    }

    projectSettings(){
        window.open("/ui/assets-publish-ui?kind=flux-project&related_id="+this.projectId, '_blank');
    }

    updateDescriptionBox(descriptionBox){
        this.unselect()
        let project = updateDescriptionBox(descriptionBox,this.project)
        this.updateProject(project)
        this.appObservables.descriptionsBoxesUpdated$.next(this.project.builderRendering.descriptionsBoxes)    
    }

    setRenderingLayout( layout, asNewState = true ){
        
        let project = setRenderingLayout(layout, this.project)
        this.updateProject(project, asNewState)
    }

    applyStyle(){        
        this.appObservables.cssUpdated$.next(this.project.runnerRendering.style)
    }

    setRenderingStyle(style, asNewState = true){

        let rootComponent = this.getLayer(this.rootLayerId) as Component.Module

        let project = setRenderingStyle(rootComponent, style, this.project)
        if(project != this.project)
            this.updateProject(project, asNewState)
    }
    
    addModuleRenderDiv(outerHtml){

        let newLayout = this.project.runnerRendering.layout + outerHtml+ "\n" 
        this.setRenderingLayout(newLayout)
    }

    updateProjectToIndexHistory(indexHistory, oldIndex){
        
        let updatesDone ={
            modules: false,
            modulesView: false,
            connections: false,
            activeLayer: false,
            descriptionBox: false
        }
        this.indexHistory   = indexHistory   
        this.project        = this.history[this.indexHistory]
        let oldProject      = this.history[oldIndex]
        
        let delta           = workflowDelta(oldProject.workflow,this.project.workflow )
        if( delta.modules.removedElements ){
            delta.modules.removedElements.filter( m=> instanceOfSideEffects(m)).forEach( m => m.dispose() )
        }
        if( delta.modules.createdElements ){
            plugBuilderViewsSignals( delta.modules.createdElements, this.builderViewsActions, 
                this.appBuildViewObservables.notification$ )
            delta.modules.createdElements.filter( m => instanceOfSideEffects(m)).forEach( m => m.apply() )
        }
        if( !updatesDone.modules && (delta.modules.createdElements.length > 0 || delta.modules.removedElements.length > 0)  ){
            this.appObservables.modulesUpdated$.next(delta.modules)
            this.appBuildViewObservables.modulesViewUpdated$.next(this.getActiveModulesView())
            updatesDone.modules = true
            updatesDone.modulesView = true
        }
        if( !updatesDone.connections && (delta.connections.createdElements.length > 0 || delta.connections.removedElements.length > 0 )){
            this.appObservables.connectionsUpdated$.next(this.project.workflow.connections)
            updatesDone.connections = true
        }
        if( !updatesDone.modulesView && (this.project.builderRendering.modulesView  !== oldProject.builderRendering.modulesView)){
            let delta = getDelta( oldProject.builderRendering.modulesView, this.project.builderRendering.modulesView)
            let updates = [
                ...delta.createdElements.filter( e => delta.removedElements.find( e2 => e2.moduleId == e.moduleId) == undefined ),
                ...delta.createdElements.filter( e => delta.removedElements.find( e2 => e2.moduleId == e.moduleId) == undefined )
            ]
            updates.length > 0 
                ? this.appBuildViewObservables.modulesViewUpdated$.next(this.getActiveModulesView())
                : this.appObservables.connectionsUpdated$.next(this.project.workflow.connections)
            if(updates.length > 0 )
                updatesDone.modulesView = true
        }            
        if( !updatesDone.activeLayer && 
            (this.activeLayerId != this.rootLayerId ||
             this.project.workflow.modules.find( m => m.moduleId == this.rootLayerId) != 
             oldProject.workflow.modules.find( m => m.moduleId == this.rootLayerId) )){

            if(!updatesDone.modulesView)     
                this.appBuildViewObservables.modulesViewUpdated$.next(this.getActiveModulesView())
            this.appObservables.descriptionsBoxesUpdated$.next(this.project.builderRendering.descriptionsBoxes)      
            this.appObservables.activeLayerUpdated$.next({fromLayerId:undefined, toLayerId:this.activeLayerId})
            updatesDone.activeLayer = true
        }
        if( !updatesDone.descriptionBox && (this.project.builderRendering.descriptionsBoxes  !== oldProject.builderRendering.descriptionsBoxes)){           
            this.appObservables.descriptionsBoxesUpdated$.next(this.project.builderRendering.descriptionsBoxes) 
            updatesDone.descriptionBox = true
        } 
        subscribeConnections(this.allSubscriptions, delta.connections, this.project.workflow.modules, this.project.workflow.plugins )  
        this.appExtensionsObservables.projectUpdated$.next(delta)

        this.debugSingleton.debugOn &&
        this.debugSingleton.logWorkflowBuilder( {  
            level : LogLevel.Info, 
            message: "updateProjectToIndexHistory", 
            object:{ oldProject, delta, newProject:this.project, history: this.history , updatesDone}
        })

    }

    undo(){
        if(this.indexHistory==0)
            return
        this.debugSingleton.debugOn &&
        this.debugSingleton.logWorkflowBuilder( {  
            level : LogLevel.Info, 
            message: "undo", 
            object: {history: this.history}
        })
        this.updateProjectToIndexHistory( this.indexHistory- 1 , this.indexHistory )
    }

    redo(){

        if(this.indexHistory==this.history.length - 1)
            return
        this.debugSingleton.debugOn && 
        this.debugSingleton.logWorkflowBuilder( {  
                level : LogLevel.Info, 
                message: "redo", 
                object:{history: this.history}
            })        
        this.updateProjectToIndexHistory( this.indexHistory + 1 , this.indexHistory)
    }

    updateProject(newProject:Project, asNewState = true){
        if(!newProject)
            return
        let oldIndex = this.indexHistory
        if(!asNewState){
            this.history = this.history.slice(0,-1)
            this.indexHistory--
        }
        if(this.indexHistory === this.history.length - 1){
            this.history.push(newProject)
            this.indexHistory++
        }
        if(this.indexHistory < this.history.length - 1){

            this.history = this.history.slice(0,this.indexHistory+1)
            this.history.push(newProject)
            this.indexHistory = this.history.length-1
        }
        this.debugSingleton.debugOn && 
        this.debugSingleton.logWorkflowBuilder( {  
                level : LogLevel.Info, 
                message: "updateProject", 
                object:{    
                    newProject: newProject,
                    history: this.history
                }
            })
        this.updateProjectToIndexHistory( this.indexHistory ,oldIndex )
    }

}