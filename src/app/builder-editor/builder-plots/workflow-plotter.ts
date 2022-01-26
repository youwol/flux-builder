
import { FluxExtensionAPIs } from '@youwol/flux-core';
import { DrawingArea } from '@youwol/flux-svg-plots';

import {
    AppStore, AppDebugEnvironment, LogLevel, AppObservables,
    AppBuildViewObservables
} from '../builder-state/index';

import { ConnectionsPlotter } from './connections-plotter';
import { ModulesPlotter } from './modules-plotter';
import { BoxSelectorPlotter } from './box-selector-plotter';
import { DescriptionsBoxesPlotter } from './descriptions-boxes-plotter';
import { PluginsPlotter } from './plugins-plotter';
import { plugLayersTransition_noTransition } from './drawing-utils';
import { BuilderRenderingAPI } from './extension';

export class WorkflowPlotter {

    debugSingleton = AppDebugEnvironment.getInstance()


    modulesPlotter: ModulesPlotter = undefined
    connectionsPlotters: ConnectionsPlotter = undefined
    boxSelectorPlotter: BoxSelectorPlotter = undefined
    descriptionsBoxesPlotter: DescriptionsBoxesPlotter = undefined
    pluginsPlotter: PluginsPlotter = undefined

    constructor(public readonly drawingArea: DrawingArea,
        public readonly appObservables: AppObservables,
        public readonly plottersObservables: AppBuildViewObservables,
        public readonly appStore: AppStore,
        public readonly options = { margin: 50 }) {

        this.descriptionsBoxesPlotter = new DescriptionsBoxesPlotter(this.drawingArea, this.plottersObservables,
            this.appObservables, this.appStore)

        this.modulesPlotter = new ModulesPlotter(this.drawingArea, this.plottersObservables,
            this.appObservables, this.appStore)

        this.connectionsPlotters = new ConnectionsPlotter(this.drawingArea, this.plottersObservables,
            this.appObservables, this.appStore)

        this.boxSelectorPlotter = new BoxSelectorPlotter(this.drawingArea, this.plottersObservables,
            this.appObservables, this.appStore, this.modulesPlotter)

        plugLayersTransition_noTransition(this.appObservables.activeLayerUpdated$, this.appStore, this.drawingArea)

        this.debugSingleton.debugOn &&
            this.debugSingleton.logWorkflowView({
                level: LogLevel.Info,
                message: "create WorkflowPlotter",
                object: {
                    drawingArea: this.drawingArea,
                    modulePlotter: this.modulesPlotter,
                    connectionsPlotters: this.connectionsPlotters
                }
            })
        this.appObservables.activeLayerUpdated$.subscribe((activeLayer) => {
            (activeLayer.toLayerId != appStore.rootComponentId)
                ? drawingArea.svgCanvas.select(".workspace-background").attr("class", "workspace-background child-layer")
                : drawingArea.svgCanvas.select(".workspace-background").attr("class", "workspace-background")
        })

        this.plugEvents()
        this.loadExtensions()
    }

    plugEvents() {

        // We should use here the d3 global event (usually d3.event when global d3 is installed)
        // 'event' is actually part of d3-selection : import { event } from 'd3-selection'
        // However: 
        // 'be aware that the value of d3.event changes during an event! An import of d3.event must be a live binding'
        // https://stackoverflow.com/questions/40012016/importing-d3-event-into-a-custom-build-using-rollup
        // => the global window.event is used

        const event = () => window.event as MouseEvent
        const getPosition = () =>
            [event().offsetX || event().clientX, event().offsetY || event().clientY]

        this.drawingArea.svgCanvas
            .on('mousedown', () =>
                this.boxSelectorPlotter.startSelection(getPosition())
            )
            .on('mousemove', () => {
                event().ctrlKey
                    ? this.boxSelectorPlotter.moveTo(getPosition())
                    : this.plottersObservables.mouseMoved$.next(getPosition())
            })
            .on('mouseup', () =>
                (event().ctrlKey) && this.boxSelectorPlotter.finishSelection(getPosition())
            )
            .on('click', () =>
                (!event().ctrlKey) && this.appStore.unselect()
            )

        window.onkeydown = (event) => {
            if (event.key == "Delete" && document.activeElement.tagName == "BODY") { this.appStore.deleteSelected() }
        }
    }


    loadExtensions() {
        // this test is for backward compatibility w/ flux-lib-core
        if (!FluxExtensionAPIs) { return }
        BuilderRenderingAPI.initialize(this)
        FluxExtensionAPIs.registerAPI('BuilderRenderingAPI', BuilderRenderingAPI)
    }
}
