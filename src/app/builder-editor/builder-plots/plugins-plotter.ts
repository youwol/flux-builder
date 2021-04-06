
import { PluginFlow } from '@youwol/flux-core';
import { DrawingArea } from '@youwol/flux-svg-plots';

import { AppObservables,AppBuildViewObservables, AppDebugEnvironment, LogLevel,
    AppStore } from '../builder-state/index';


function drawPlugin(plugin :PluginFlow<any>, containerGroup, appStore: AppStore ) {

    let display = new plugin.Factory.BuilderView()
    let pluginGroup = display.render(plugin)
    pluginGroup.onclick = (e) =>{  e.stopPropagation() ; appStore.selectModule(plugin.moduleId) }

    let a = containerGroup.querySelector("#"+plugin.moduleId)
    if(a)
        a.remove()
    pluginGroup.id=plugin.moduleId
    pluginGroup.classList.add("module","plugin")
    let dyModule = 0
    let dyPlugin = 50
    
    if(containerGroup.getBBox) 
        dyModule = containerGroup.getBBox().height - containerGroup.querySelector(".content").getBBox().height /2 
    // we need to actually append the group of the plugin to get its bounding box
    containerGroup.appendChild(pluginGroup)
    if( pluginGroup.getBBox)
        dyPlugin =  pluginGroup.getBBox().height/2
        
    let dy = dyModule + dyPlugin
    pluginGroup.setAttribute("x",  containerGroup.getAttribute("x"))
    pluginGroup.setAttribute("y",  Number(containerGroup.getAttribute("y"))+dy)
    pluginGroup.setAttribute("transform",  "translate(0," + dy + ")")

    return pluginGroup
}

export class PluginsPlotter {

    debugSingleton = AppDebugEnvironment.getInstance()

    groups = {}
    constructor(public readonly drawingArea: DrawingArea,
        public readonly plottersObservables: AppBuildViewObservables,
        public readonly appObservables: AppObservables,
        public readonly appStore: AppStore) {

        this.debugSingleton.debugOn &&
            this.debugSingleton.logWorkflowView({
                level: LogLevel.Info,
                message: "create plugins plotter",
                object: {drawingArea, plottersObservables}
            })
    }

    draw(modulesDrawn){
        Object.values(this.groups).forEach( (g:any) => g.remove())
        let plugInsToPlot = this.appStore.project.workflow.plugins
        .filter( p => modulesDrawn[p.parentModule.moduleId])
        .map( p => [p,modulesDrawn[p.parentModule.moduleId]])
        this.debugSingleton.debugOn &&
        this.debugSingleton.logWorkflowView({
            level: LogLevel.Info,
            message: "PluginsPlotter draw",
            object: { modulesDrawn: modulesDrawn, plugins: this.appStore.project.workflow.plugins,plugInsToPlot }
        })
        
        this.groups = plugInsToPlot
        .map( ([plugin, parentSvgGroup]) => [ plugin.moduleId, drawPlugin(plugin, parentSvgGroup, this.appStore) ])
        .reduce( (acc,e) =>{ acc[e[0]] = e[1]; return acc}  , {})
        return this.groups
    }

}