import { Workflow } from '@youwol/flux-core';

declare var _ : any

export function getDelta<T>(oldCollection : Array<T>, newCollection : Array<T>) : {createdElements: Array<T>,removedElements: Array<T>}{

    let createdElements = newCollection.filter(x => !oldCollection.includes(x));
    let removedElements = oldCollection.filter(x => !newCollection.includes(x));
    return { createdElements,removedElements}
}
    


export function workflowDelta(oldWf:Workflow,newWf:Workflow){
    
    let diffsConnection = {createdElements:[], removedElements:[]}
    let diffModules = {createdElements:[], removedElements:[]}
    if( newWf.connections  !== oldWf.connections){        
        let diffs = getDelta( oldWf.connections, newWf.connections)
        diffsConnection.createdElements.push(...diffs.createdElements)
        diffsConnection.removedElements.push(...diffs.removedElements)
    }
  
    if( newWf.modules  !== oldWf.modules){
        let diffs = getDelta( oldWf.modules, newWf.modules )
        diffModules.createdElements.push(...diffs.createdElements)
        diffModules.removedElements.push(...diffs.removedElements)

        let createdMdlesId =  diffs.createdElements.map(m=>m.moduleId)
        let deletedMdlesId =  diffs.removedElements.map(m=>m.moduleId)
        
        diffsConnection.createdElements.push( ...newWf.connections.filter( c =>  createdMdlesId.includes(c.end.moduleId ) ), 
                                              ...newWf.connections.filter( c =>  createdMdlesId.includes(c.start.moduleId ) ) )

        diffsConnection.removedElements.push( ...oldWf.connections.filter( c =>  deletedMdlesId.includes(c.start.moduleId ) || deletedMdlesId.includes(c.end.moduleId )  ) )
    }
    if( newWf.plugins  !== oldWf.plugins){
        
        let diffs = getDelta( oldWf.plugins, newWf.plugins )
        diffModules.createdElements.push(...diffs.createdElements)
        diffModules.removedElements.push(...diffs.removedElements)

        let createdMdlesId =  diffs.createdElements.map(m=>m.moduleId)
        let deletedMdlesId =  diffs.removedElements.map(m=>m.moduleId)
        
        diffsConnection.createdElements.push( ...newWf.connections.filter( c =>  createdMdlesId.includes(c.end.moduleId ) ), 
                                              ...newWf.connections.filter( c =>  createdMdlesId.includes(c.start.moduleId ) ) )

        diffsConnection.removedElements.push( ...oldWf.connections.filter( c =>  deletedMdlesId.includes(c.start.moduleId ) || deletedMdlesId.includes(c.end.moduleId )  ) )
    }
    diffsConnection.createdElements = Array.from(new Set(diffsConnection.createdElements))
    diffsConnection.removedElements = Array.from(new Set(diffsConnection.removedElements))

    diffModules.createdElements = Array.from(new Set(diffModules.createdElements))
    diffModules.removedElements = Array.from(new Set(diffModules.removedElements))

    let count = diffsConnection.createdElements.length + diffsConnection.removedElements.length +
    diffModules.createdElements.length + diffModules.removedElements.length
    return { 
        connections: diffsConnection, 
        modules: diffModules, 
        hasDiff: count >0
    }  
  }