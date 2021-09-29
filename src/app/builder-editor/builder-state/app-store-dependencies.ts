

import { Environment, IEnvironment, LoadingGraphSchema, Project, Requirements } from '@youwol/flux-core'
import { Observable, of } from 'rxjs'
import { map } from 'rxjs/operators'


function updateRequirements(loadingGraph: LoadingGraphSchema, project: Project): Project {
    let actualReqs = project.requirements

    let libraries = loadingGraph.lock.reduce((acc, e) => ({ ...acc, ...{ [e.name]: e.version } }), {})
    let packs = loadingGraph.lock
        .filter(library => library.type == 'flux-pack')
        .map(library => library.name )
    let requirements = new Requirements(actualReqs.fluxComponents, Array.from(packs),
        libraries, loadingGraph)
    let newProject = new Project({
        ...project,
        ...{requirements}
    })
    return newProject
}


export function addLibraries(
    libraries: Array<{ name: string, version: string, namespace: string }>,
    fluxPacks: Array<{name:string}>,
    project: Project,
    environment: IEnvironment
    ): Observable<Project> {

    let actualLibraries = project.requirements.libraries
    let versionChecks = libraries
        .filter(lib => actualLibraries[lib.name] != undefined && actualLibraries[lib.name] != lib.version)

    if (versionChecks.length > 0)
        console.error("You can not dynamically add libraries that are already used with different version")

    let newLibraries = libraries
    .filter(lib => actualLibraries[lib.name] == undefined)
    .reduce((acc, e) => ({ ...acc, ...{ [e.name]: e.version } }), {})

    let actualPacks = project.requirements.fluxPacks
    
    let newPacks = Array.from(new Set(fluxPacks.map(p =>p.name)))
    .filter(pack => !actualPacks.includes(pack))

    newPacks.filter( name =>  {
        console.log(name, window[name])
        return window[name] && ( window[name].install || window[name].pack.install) 
    })
    .forEach((name) => {
        let install = (window[name].install || window[name].pack.install)(environment)
        if(install instanceof Observable)
            install.subscribe()
        if(install instanceof Promise) 
            install.then( ()=> {})
    })
    let body = {
        libraries: {
            ...project.requirements.libraries,
            ...newLibraries
        } as {[key:string]: string}
    }
    return environment.getLoadingGraph(body).pipe(
        map((loadingGraph) => {
            let newProject = updateRequirements(loadingGraph, project)
            return newProject
        })
    )
}

export function cleanUnusedLibraries(project: Project, environment: IEnvironment): Observable<Project> {

    /*if (!environment.getLoadingGraph) {
        return of(project)
    }*/
    let setPackagesUsed = new Set(
        [...project.workflow.modules.map(m => m.Factory.packId),
        ...project.workflow.plugins.map(m => m.Factory.packId)
        ]
    )
    let packagesUsed = new Array(...setPackagesUsed)
    if (packagesUsed.length == project.requirements.fluxPacks.length)
        return of(project)

    let libraries = Object.entries(project.requirements.libraries)
        .filter(([k, v]) => packagesUsed.find(p => k.includes(p)))
        .reduce((acc, [k, v]) => ({ ...acc, ...{ [k]: v } }), {})

    let body = {
        libraries: libraries,
        using: project.requirements.libraries
    }
    return environment.getLoadingGraph(body).pipe(
        map((loadingGraph) => {
            let newProject = updateRequirements(loadingGraph, project)
            return newProject
        })
    )
}
