import { Subject, ReplaySubject } from "rxjs";
import { LogLevel, AppDebugEnvironment } from "./app-debug.environment";
import { Connection, ModuleFlux,ModuleView } from '@youwol/flux-core';


export class AppBuildViewObservables{

    private static instance : AppBuildViewObservables = undefined
    static getInstance() {
        if(!AppBuildViewObservables.instance)
            {AppBuildViewObservables.instance =  new AppBuildViewObservables()}
        return AppBuildViewObservables.instance
    }


    debugSingleton = AppDebugEnvironment.getInstance()

    connectionsView$  = new Subject<Array<Connection>>()
    modulesViewUpdated$ = new Subject<Array<ModuleView>>()
    moduleViewSelected$ = new Subject<any>()
    
    modulesDrawn$ = new ReplaySubject<any>(1)
    connectionsDrawn$ = new ReplaySubject<any>(1)
    descriptionsBoxesDrawn$ = new ReplaySubject<any>(1)
    activeLayerDrawn$ = new ReplaySubject<any>(1)
    modulesViewCompleted$ = new Subject<Array<ModuleFlux>>()
    plugsViewCompleted$ = new Subject<Array<ModuleFlux>>()
    connectionsViewCompleted$ = new Subject<Array<ModuleFlux>>()

    
    moduleEvent$ = new Subject<any>()

    moduleSelected$ = new Subject<any>()
    
    plugInputClicked$ = new Subject<any>()
    plugOutputClicked$ = new Subject<any>()
    mouseMoved$ = new Subject<any>()
    notification$ = new ReplaySubject<any>(1)

    constructor(){

        if(this.debugSingleton.debugOn){
            ["modulesViewUpdated$","moduleViewSelected$","moduleSelected$","moduleEvent$","modulesDrawn$",
            "descriptionsBoxesDrawn$","activeLayerDrawn$","notification$", "connectionsDrawn$" ]
            .forEach( id => this[id].subscribe( (...args)    => this.log(id, ...args) )  )
        }
    }

    log(name , ...args){

        this.debugSingleton.debugOn && 
        this.debugSingleton.logWorkflowView$( {  
            level : LogLevel.Info, 
            message:  name, 
            object:{ args:args 
            }})
    }
}
