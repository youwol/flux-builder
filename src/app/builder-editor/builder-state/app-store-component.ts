import { Workflow, Component} from '@youwol/flux-core';
    
import { AppDebugEnvironment, LogLevel } from './app-debug.environment';
import { updateComponent } from './app-store-modules-group';
import { clonePluginsForNewParents } from './app-store-modules';


const toHtml = (content: string) => {
    var template = document.createElement('div');
    template.innerHTML = (content as any).trim();
    return template as HTMLDivElement
}


export function applyHtmlLayout( 
    workflow: Workflow,
    html: string 
    ) : Workflow {
    
    const debugSingleton = AppDebugEnvironment.getInstance()

    const htmlDiv = toHtml(html)
    if(!htmlDiv)
        {return workflow}

    const componentsDiv = Array.from(htmlDiv.querySelectorAll(".flux-component"))
    .reduce( (acc,e) => {
       return {...acc, ...{[e.id]:e.cloneNode(true)}}
    }, {})

    const componentIds = Object.keys(componentsDiv)
    // we only update the components that are part of the html layout
    // others will keep they previous layout (desired)
    const componentsToEventuallyUpdate = componentIds
    .map( (componentId) => workflow.modules.find( mdle => mdle.moduleId==componentId))

    const newComponents = componentsToEventuallyUpdate.map( (component: Component.Module) => {
        const deepHtml = componentsDiv[component.moduleId]
        if(!deepHtml)
            {return undefined}

        component.getDirectChildren(workflow)
        .filter( child => child instanceof Component.Module)
        .forEach( (childComponent: Component.Module) => {
            const childComponentDiv = deepHtml.querySelector(`#${childComponent.moduleId}`)
            if(childComponentDiv)
                {childComponentDiv.innerHTML = ''} 
        })
        const html = deepHtml.outerHTML
        if(html == component.getPersistentData<Component.PersistentData>().html)
            {return undefined}

        const newComponent = updateComponent(component, {html})
        return newComponent
    })
    .filter( d => d)

    debugSingleton.debugOn && 
    debugSingleton.logWorkflowBuilder( {  
        level : LogLevel.Info, 
        message: "apply html layout", 
        object:{    
            newComponents, eventualUpdateNeeded: componentIds
        }
    })

    const newPluginsReplaced = clonePluginsForNewParents(newComponents, workflow)

    const newWorkflow = new Workflow({
        ...workflow,
        modules: workflow.modules
        .filter( mdle => ! newComponents.find( component => component.moduleId == mdle.moduleId))
        .concat(...newComponents),
        plugins: workflow.plugins
        .filter( mdle => ! newPluginsReplaced.find( plugin => plugin.moduleId == mdle.moduleId))
        .concat(...newPluginsReplaced)
    })
    return newWorkflow
}

export function applyHtmlCss( 
    rootComponent: Component.Module,
    workflow: Workflow,
    css: string 
    ) : Workflow {

    const debugSingleton = AppDebugEnvironment.getInstance()

    const wrapDiv = (html) => {
        // the html of the current layer is appended to a wrapper div such that 
        // 'querySelectorAll' will also account for the 'Component_xxx' (root DOM) of 'html'
        const wrapperDiv = document.createElement('div')
        wrapperDiv.appendChild(html)
        return wrapperDiv
    }

    const toCss = (content: string) => {

        const styleSheet = new CSSStyleSheet()
        content.split('}')
        .filter( rule => rule!="")
        .map( rule => (rule+"}").trim())
        .forEach( rule => {
            styleSheet.insertRule(rule) 
        })
        return styleSheet; 
    }
    const isEquivalent = (oldRules: string[], newRules:string[]) => {
        oldRules = oldRules.filter( d => d!= "")
        newRules = newRules.filter( d => d!= "")
        if(oldRules.length!=newRules.length)
            {return false}
        const founds = oldRules.map( oldRule => newRules.includes(oldRule))
        return founds.reduce( (acc,e)=> acc && e, true)
    }
    const styleSheet = toCss(css)
    const htmlRoot = wrapDiv(rootComponent.getFullHTML(workflow))

    if(!htmlRoot)
        {return workflow}

    
    const newComponents = workflow.modules
    .filter( mdle => mdle instanceof Component.Module)
    // do not update the style if the element is not actually in the view 
    // (required by grapes: if a component is removed all its styles too - we style want to keep them if it is re-inserted)
    .filter( mdle => htmlRoot.querySelector(`#${mdle.moduleId}`) != undefined)
    // fetch all the rules that applies for the component
    .map( (component: Component.Module) => {
        const html = component.getOuterHTML()
        const wrapperDiv = wrapDiv(html)
        const cssRules = new Set<string>()


        for(let i=0; i<styleSheet.rules.length;i++) {
            const cssRule = styleSheet.rules[i] as any
            const elements =  Array
            .from(wrapperDiv.querySelectorAll(cssRule.selectorText))
            // The style of child components belong to the child, not the parent
            .filter( element => {
                const childrenComponentId = component
                .getDirectChildren(workflow)
                .filter( c => c instanceof Component.Module)
                .map(child => child.moduleId)
                return !childrenComponentId.includes(element.id) 
            })
            if(elements.length>0 )
                {cssRules.add(cssRule.cssText)}
        }
        const oldCssRules = component.getPersistentData<Component.PersistentData>().css.split("\n")

        if(isEquivalent(oldCssRules, [...cssRules] ))
            {return undefined}

        const css : string = [...cssRules].reduce((acc: string,e: string) => acc+"\n"+e, ""); 
       
        const newComponent = updateComponent(component, {css})
        return newComponent
    })
    .filter( d => d)
    if(newComponents.length==0){
        debugSingleton.debugOn && 
        debugSingleton.logWorkflowBuilder( {  
            level : LogLevel.Info, 
            message: "no changes in css", 
            object:{}
        })
        return workflow
    }
    const newWorkflow = new Workflow({
        ...workflow,
        modules: workflow.modules
        .filter( mdle => ! newComponents.find( component => component.moduleId == mdle.moduleId))
        .concat(...newComponents)
    })
    return newWorkflow
}



/*
export function addRemoteComponent( component, modulesFactory, coors, project: Project , activeLayerId, 
    workflowGetter, ready$ : any, environment: any) {
    
    let debugSingleton = AppDebugEnvironment.getInstance()

    let getAllLayerIds = ( layer: LayerTree):Array<string> => 
        [layer.layerId].concat( layer.children.map(child => getAllLayerIds(child)).reduce( (acc,e)=>acc.concat(e),[]))

    let layerIdsMap = getAllLayerIds(component.workflow.rootLayerTree).map( layerId => [layerId, uuidv4()])
    .reduce( (acc,[originalId, newId]) => Object.assign({}, acc, {[originalId]:newId}), {})

    let moduleIdsMap = [...component.workflow.modules,...component.workflow.plugins].map( moduleData => {
        let Factory = modulesFactory.get(moduleData.factoryId)
        let moduleId = isGroupingModule(moduleData) ?
            Factory.id+"_"+layerIdsMap[moduleData.moduleId.split(Factory.id+"_")[1]]:
            Factory.id + "_" + uuidv4()

        return [moduleData.moduleId,moduleId]
    })
    .reduce( (acc,[originalId, newId]) => Object.assign({}, acc, {[originalId]:newId}), {})


    let baseData = (moduleData, Factory) => {

        let conf    = new Factory.Configuration({
            title:         moduleData.configuration.title,
            description:   moduleData.configuration.description,
            data:          new Factory.PersistentData(moduleData.configuration.data)
        })
        return {
            moduleId:          moduleIdsMap[moduleData.moduleId], 
            configuration:     conf, 
            ready$:            ready$,
            Factory:           Factory,
            environment:       environment
        }
    } 

    let newModules = component.workflow.modules.map(moduleData => {

        let Factory = modulesFactory.get(moduleData.factoryId)
        let suppData = isGroupingModule(moduleData) ? 
        {workflowGetter, layerId:layerIdsMap[moduleData.moduleId.split(Factory.id+"_")[1]] } : {}

        let mdle  = new Factory.Module( Object.assign(baseData(moduleData,Factory),suppData) )      
        return mdle 
    } )
    let newPlugins = component.workflow.plugins.map(pluginData => {

        let Factory = modulesFactory.get(pluginData.factoryId)
        let parentModule = newModules.find( m => m.moduleId === moduleIdsMap[pluginData.parentModuleId] )
        let mdle  = new Factory.Module(Object.assign(baseData(pluginData,Factory),{parentModule})  )                        
        return mdle 
    } )
    let cloneAndMapLayerTree = (layerTree: LayerTree ) :LayerTree => 
        new LayerTree(layerIdsMap[layerTree.layerId],layerTree.title,layerTree.children.map(c => cloneAndMapLayerTree(c)),
            layerTree.moduleIds.map( mId=>moduleIdsMap[mId]))
            
    let newLayerTree = cloneAndMapLayerTree(component.workflow.rootLayerTree)

    let newConnections = component.workflow.connections.map( (c:Connection) => {
        return new Connection(
            new SlotRef(c.start.slotId, moduleIdsMap[c.start.moduleId]),
            new SlotRef(c.end.slotId, moduleIdsMap[c.end.moduleId]),
            c.adaptor 
                ? new Adaptor(uuidv4(), c.adaptor.mappingFunction) 
                : undefined)
    })

    let newModulesView = component.builderRendering.modulesView.map(
        (mView : ModuleView)=> {
            let pos = mView.moduleId.split("_")[1] == component.workflow.rootLayerTree.layerId ? 
                coors :
                [mView.xWorld,mView.yWorld]
            return new ModuleView(moduleIdsMap[mView.moduleId],pos[0],pos[1],
                newModules.find( m=>m.moduleId == moduleIdsMap[mView.moduleId]).Factory) 
        }
    )
    let rootComponent = newModules.find( mdle => mdle instanceof GroupModules.Module && mdle.layerId == newLayerTree.layerId) 
    let clonedLayerTree = cloneLayerTree(project.workflow.rootLayerTree)
    let activeLayer = clonedLayerTree.getLayerRecursive((layer)=> layer.layerId == activeLayerId)
    activeLayer.children.push(newLayerTree)
    activeLayer.moduleIds.push(rootComponent.moduleId)
    let workflow   = new Workflow(  project.workflow.modules.concat(newModules),
                                    project.workflow.connections.concat(newConnections),
                                    project.workflow.plugins.concat(newPlugins),
                                    clonedLayerTree)
                                    
    let builderRendering = new BuilderRendering(
        project.builderRendering.modulesView.concat(newModulesView),
        project.builderRendering.connectionsView,
        project.builderRendering.descriptionsBoxes
        )

    if(component.runnerRendering){
        
        let newLayout = component.runnerRendering.layout 
        Object.entries(moduleIdsMap).forEach( ([originalId, newId]) => {
            newLayout = newLayout.replace(originalId, newId)
        })        
    
        rootComponent.rendering = { layout : newLayout, style: component.runnerRendering.style}
    }
    
    let projectNew = new Project( 
        project.name,
        project.schemaVersion,
        project.description,
        project.requirements,
        workflow,
        builderRendering,
        project.runnerRendering
    )

    return projectNew
}
*/