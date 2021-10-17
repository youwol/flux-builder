import './dependencies'
import { AppBuildViewObservables, AppDebugEnvironment, AppObservables, AppStore } from '../../app/builder-editor/builder-state/index'
import { Connection, GroupModules, SlotRef } from '@youwol/flux-core'
import { take } from 'rxjs/operators'

import * as FluxEntitiesPlot from '@youwol/flux-svg-plots';
import { environment } from '../common/dependencies'


let appObservables = AppObservables.getInstance()
AppDebugEnvironment.getInstance().debugOn = false
let Factory: any = GroupModules


test('group modules module creation & BuilderView', done => {

    let appStore: AppStore = new AppStore(
        environment,
        AppObservables.getInstance(),
        AppBuildViewObservables.getInstance()
    )

    appObservables.projectUpdated$.pipe(
        take(1)
    ).subscribe(() => {
        appStore.addGroup(['module1'])
    })
    appObservables.projectUpdated$.pipe(
        take(1)
    ).subscribe((delta) => {
        /*
                          |~module2~|\
                                      \
                                       \
        |~module3~|-----||~module1~||----|~module0~|-
                        ||~module1~||----|~plugin ~|
        */
        let groupModule = delta.modules.createdElements
            .find(mdle => mdle.moduleId != appStore.rootComponentId) as GroupModules.Module

        let connections = groupModule.getConnections(appStore.project.workflow)
        expect(connections.implicits.inputs.length).toEqual(1)
        expect(connections.implicits.outputs.length).toEqual(2)
        let renderer = new Factory.BuilderView(FluxEntitiesPlot)

        let plot = renderer.render(groupModule)

        let svgInputsElement = plot.querySelectorAll(".slot.input")
        expect(svgInputsElement.length).toEqual(1)
        // there is only one because it is actually the same input that is referenced 
        let svgOutputsElement = plot.querySelectorAll(".slot.output")
        expect(svgOutputsElement.length).toEqual(1)

        appStore.addConnection(new Connection(
            new SlotRef("output0", "module1"),
            new SlotRef("input0", "module2")
        )
        )
    })

    appObservables.projectUpdated$.pipe(
        take(1)
    ).subscribe((delta) => {
        /*
                          |~module2~|\
                                      \
                                       \
        |~module3~|-----||~module1~||----|~module0~|-
                        ||~module1~||----|~plugin ~|
                        ||~module1~||----|~module2 ~|
        */
        let groupModule = appStore.project.workflow.modules
            .find(mdle => mdle.moduleId.includes("GroupModules_")) as GroupModules.Module

        let connections = groupModule.getConnections(appStore.project.workflow)
        expect(connections.implicits.inputs.length).toEqual(1)
        expect(connections.implicits.outputs.length).toEqual(3)
        let renderer = new Factory.BuilderView(FluxEntitiesPlot)

        let plot = renderer.render(groupModule)

        let svgInputsElement = plot.querySelectorAll(".slot.input")
        expect(svgInputsElement.length).toEqual(1)
        // there is only one because it is actually the same input that is referenced 
        let svgOutputsElement = plot.querySelectorAll(".slot.output")
        expect(svgOutputsElement.length).toEqual(1)

        done()
    })
    appStore.loadProjectId("simpleProjectConnection")
})
