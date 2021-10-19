import { Subject, ReplaySubject } from "rxjs";
import { Package, Connection, ModuleFlux, DescriptionBox, WorkflowDelta  }from '@youwol/flux-core';

import { AppDebugEnvironment, LogLevel } from "./app-debug.environment";
import { UiState } from './app-store';


export class AppObservables{

    private static instance : AppObservables = undefined
    static getInstance() {
        if(!AppObservables.instance)
            {AppObservables.instance =  new AppObservables()}
        return AppObservables.instance
    }


    debugSingleton = AppDebugEnvironment.getInstance()

    projectUpdated$             = new ReplaySubject<WorkflowDelta>(1)
    packagesObserver$           = new ReplaySubject<any>(1)
    packagesLoaded$             = new ReplaySubject<any>(1)
    uiStateUpdated$             = new ReplaySubject<UiState>(1)
    packagesUpdated$            = new Subject<Array<Package>>()
    connectionsUpdated$         = new Subject<Array<Connection>>()
    modulesUpdated$             = new Subject<{createdElements: Array<ModuleFlux>, removedElements:  Array<ModuleFlux>}>()
    moduleAdded$                = new Subject<ModuleFlux>()
    moduleSelected$             = new Subject<ModuleFlux>()
    modulesUnselected$          = new Subject<Array<ModuleFlux>>()
    moduleSettingsEdited$       = new Subject<any>()
    adaptorEdited$              = new Subject<any>()
    connectionSelected$         = new Subject<Connection>()
    unselect$                   = new Subject()
    renderingLoaded$            = new Subject<{style, layout, cssLinks}>()
    cssUpdated$                 = new Subject<string>()
    descriptionsBoxesUpdated$   = new Subject<Array<DescriptionBox>>()
    activeLayerUpdated$         = new Subject<{fromLayerId:string, toLayerId:string}>()
    ready$                      = new ReplaySubject<boolean>(1)
    flowReady$                  = new Subject<any>()
    suggestions$                = new Subject<Array<any>>()
    
    notifications$              = new Subject<Array<any>>()


    constructor(){

        if(this.debugSingleton.debugOn){
            ["projectUpdated$", "packagesObserver$","packagesLoaded$","packagesUpdated$","connectionsUpdated$",
            "unselect$","moduleSelected$","modulesUnselected$","moduleSettingsEdited$","connectionSelected$",
            "renderingLoaded$","moduleAdded$","cssUpdated$","uiStateUpdated$","descriptionsBoxesUpdated$",
            "activeLayerUpdated$","ready$","flowReady$","suggestions$","modulesUpdated$","notifications$"]
            .forEach( id => this[id].subscribe( (...args)    => this.log(id, ...args) )  )
        }        
    }

    log(name , ...args){

        this.debugSingleton.debugOn && 
        this.debugSingleton.logObservable( {  
            level : LogLevel.Info, 
            message: name, 
            object:{ args:args 
            }})
    }
}