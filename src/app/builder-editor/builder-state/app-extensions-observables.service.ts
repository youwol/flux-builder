
import { AppDebugEnvironment, LogLevel } from "./app-debug.environment";
import {ExtensionsObservables  } from '@youwol/flux-core';

export class AppExtensionsObservables extends ExtensionsObservables {

    private static instance : AppExtensionsObservables = undefined
    static getInstance() {
        if(!AppExtensionsObservables.instance)
        {AppExtensionsObservables.instance =  new AppExtensionsObservables()}
        return AppExtensionsObservables.instance
    }
    debugSingleton = AppDebugEnvironment.getInstance()

    constructor(){
        super()
        if(this.debugSingleton.debugOn){
            ["projectUpdated$"]
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