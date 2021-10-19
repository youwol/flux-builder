
import { take, skip } from 'rxjs/operators'

import { createDrawingArea } from '@youwol/flux-svg-plots'

import '../common/dependencies'
import {
    AppObservables, AppDebugEnvironment, AppStore,
    AppBuildViewObservables
} from '../../app/builder-editor/builder-state/index'
import { ModulesPlotter } from '../../app/builder-editor/builder-plots/index'
import { environment } from '../common/dependencies'


test('load simple project', (done) => {

    const div = document.createElement("div")
    div.id = "plot-container"
    document.body.appendChild(div)

    const drawingArea = createDrawingArea(
        {
            containerDivId: "plot-container",
            width: 100,
            height: 100,
            xmin: -50,
            ymin: -50,
            xmax: 50.,
            ymax: 50,
            margin: 0,
            overflowDisplay: { left: 1e8, right: 1e8, top: 1e8, bottom: 1e8 }
        })


    const appObservables = AppObservables.getInstance()
    const plottersObservables = AppBuildViewObservables.getInstance()
    AppDebugEnvironment.getInstance().debugOn = false

    const appStore: AppStore = AppStore.getInstance(environment)
    const plotter = new ModulesPlotter(drawingArea, plottersObservables, appObservables, appStore)

    plottersObservables.modulesDrawn$.pipe(take(1)).subscribe(() => {

        const modules = document.querySelectorAll("g.module.entity")
        expect(modules).toHaveLength(2)

        const module0 = document.getElementById("module0")
        expect(module0).toBeDefined()
        expect(module0.getAttribute("transform")).toBe("translate(50,50)")
        const groupMdle = document.getElementById("GroupModules_child-layer")
        expect(groupMdle.getAttribute("transform")).toBe("translate(60,50)")
        expect(document.getElementById("module1")).toBeNull()

        //let plugins = document.querySelectorAll("g.plugin")
        //expect(plugins.length).toEqual(1)
        const pluginDom = document.getElementById("plugin0")
        expect(pluginDom).toBeDefined()
        expect(pluginDom.parentElement.id).toBe("module0")

        const module = document.getElementById("module0")
        const event = new MouseEvent('click', { button: 0 })
        module.dispatchEvent(event)
        plotter.highlight(["module0", "module1"])

        expect(module0.classList.contains("highlighted")).toBeTruthy()

        appStore.unselect()
        expect(module0.classList.contains("highlighted")).toBeFalsy()

        const modulesView = appStore.getActiveModulesView()

        expect(modulesView).toHaveLength(2)
        expect(modulesView[0].moduleId).toBe("module0")
        expect(modulesView[0].xWorld).toBe(0)
        expect(modulesView[0].yWorld).toBe(0)
        expect(modulesView[1].moduleId).toBe("GroupModules_child-layer")
        expect(modulesView[1].xWorld).toBe(10)
        expect(modulesView[1].yWorld).toBe(0)

        appStore.selectModule("module0")
        plotter.dragSelection({ dx: 2, dy: 0 }, false)
        plotter.dragSelection({ dx: 1, dy: 1 }, true)

        plottersObservables.modulesDrawn$.next({})
    })

    plottersObservables.modulesDrawn$.pipe(skip(1), take(1)).subscribe(
        () => {
            const module0 = document.getElementById("module0")
            expect(module0).toBeDefined()
            expect(module0.getAttribute("transform")).toBe("translate(53,51)")

            appStore.selectActiveGroup("GroupModules_child-layer")
            const modulesView = appStore.getActiveModulesView()
            // there is module 0 from root-component and module1 from child_layer
            expect(modulesView).toHaveLength(2) // plugin not here, should it be?
            const mdleView1 = modulesView.find(m => m.moduleId === "module1")
            expect(mdleView1).toBeDefined()
            expect(mdleView1.xWorld).toBe(10)
            expect(mdleView1.yWorld).toBe(0)

            appStore.selectModule("module0")
            const selected = appStore.getModuleSelected()
            expect(selected.moduleId).toBe("module0")
            const newPos = plotter.dragSelection({ dx: 10, dy: 10 }, true)
            expect(newPos).toHaveLength(0)

            expect(document.getElementById("module0")).toBeDefined()

            plotter.highlight(["module1"])

            const module1 = document.getElementById("module1")
            expect(module1.classList.contains("highlighted")).toBeTruthy()

            const t = module0.getAttribute("transform")

            appStore.unselect()
            appStore.deleteModules([appStore.getModule("module1")])
            //appStore.selectActiveGroup("Component_root-component")
        })
    plottersObservables.modulesDrawn$.pipe(skip(2), take(1)).subscribe(
        () => {
            // we are looking at 'child_layer' selected & empty, module0 is displayed in the parent layer
            let module0 = document.getElementById("module0")
            expect(module0).toBeTruthy()

            const modulesView = appStore.getActiveModulesView()
            expect(modulesView).toHaveLength(1)
            const module1 = document.getElementById("module1")
            expect(module1).toBeNull()
            const grpMdleExpanded = document.getElementById("expanded_GroupModules_child-layer")
            expect(grpMdleExpanded).toBeTruthy()

            module0 = document.getElementById("module0")
            expect(module0).toBeTruthy()
            const transfrom = module0.getAttribute("transform")
            expect(transfrom).toBe("translate(50,50)")
            appStore.selectActiveGroup("Component_root-component")
        })
    plottersObservables.modulesDrawn$.pipe(skip(3), take(1)).subscribe(
        () => {
            // we are looking at 'child_layer' selected & empty, module0 is displayed in the parent layer
            const module0 = document.getElementById("module0")
            expect(module0).toBeTruthy()

            const modulesView = appStore.getActiveModulesView()
            expect(modulesView).toHaveLength(2)
            const module1 = document.getElementById("module1")
            expect(module1).toBeNull()
            const grpMdleExpanded = document.getElementById("expanded_GroupModules_child-layer")
            expect(grpMdleExpanded).toBeNull()
            const grpMdle = document.getElementById("GroupModules_child-layer")
            expect(grpMdle).toBeTruthy()

            done()
        })

    appStore.loadProjectId("simpleProject")
})


