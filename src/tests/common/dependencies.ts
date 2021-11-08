console.log = (...args) => {}

class FakeBroadcastChannel{ constructor(a){}}
window["BroadcastChannel"] = FakeBroadcastChannel as any

import { KeyLoadingGraphStore, LoadingGraphSchema, MockEnvironment } from '@youwol/flux-core'
import { testPack, } from './simple-module'
import { projects } from './projects-data'



const loadingGraphResponses = [
    [
        {libraries: { 'flux-test':'0.0.0'}, using: {'flux-test':'0.0.0'}},
        { 
            definition:[
                [["assetId_flux-test", "cdn/libraries/flux-test/0.0.0/bundle.js"]]
            ], 
            lock:[
                { id:"assetId_flux-test", name:"flux-test", version:"0.0.0", type:'flux-pack' }
            ],
            graphType:"sequential-v1"
        } as LoadingGraphSchema 
    ]
] as Array<[KeyLoadingGraphStore,LoadingGraphSchema]>

export const environment = new MockEnvironment({   
    projectsDB: projects, 
    fluxPacks: [testPack], 
    loadingGraphResponses,
    console: {
        log: () => {},
        error: (...args) => { console.error(args)},
        warn: (...args) => { console.warn(args)}
    }
})
