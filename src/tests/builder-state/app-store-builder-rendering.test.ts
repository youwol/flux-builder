import  './dependencies'

import { AppDebugEnvironment } from '../../app/builder-editor/builder-state'
import { instantiateProjectModules, instantiateProjectBuilderRendering, Workflow } from '@youwol/flux-core'
import { testPack } from '../common/simple-module'
import { environment } from '../common/dependencies'
import { Subject } from 'rxjs'


test('instantiateBuilderRendering', () => {

    AppDebugEnvironment.getInstance().debugOn = false
    let workflow$ = new Subject<Workflow>()
    let modulesData = [{
        moduleId : "unique-id-0",
        factoryId:{module:"SimpleModule", pack:"flux-test"},
        configuration:{
        title:"title module id 0",
        description:"",
        data:{
            property0:1
        }
        }
    }]
    let factory = new Map( 
        Object.values(testPack['modules'])
        .map( (mdleFact) => [( JSON.stringify({module:mdleFact['id'], pack:testPack.name})), mdleFact ])
      )
    let modules =  instantiateProjectModules(modulesData,factory, environment, workflow$)

    let renderBuilderData = {
        modulesView : modulesData.map( m => ({ moduleId: m.moduleId, xWorld:0, yWorld:0 }) ),
        descriptionsBoxes: [
            {
                descriptionBoxId : "descriptionsBoxId",
                title : "description box title",
                modulesId : modulesData.map( m =>  m.moduleId),
                descriptionHtml : "",
                properties: {color:"red"}
            }
        ],
        connectionsView: []
    }

    let builderRendering = instantiateProjectBuilderRendering(modules,renderBuilderData)

    expect(builderRendering.modulesView.length).toEqual(modulesData.length)
})
  