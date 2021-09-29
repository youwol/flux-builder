import { Project, LayerTree, Workflow, BuilderRendering, ModuleView,
    ModuleFlux, GroupModules, IEnvironment, ModuleConfiguration, Component} from '@youwol/flux-core';
    
import { uuidv4 } from './utils';
import { AppDebugEnvironment, LogLevel } from './app-debug.environment';
import { updateComponent, updateGroup } from './app-store-modules-group';


export function getLayer(parentGroup: GroupModules.Module, group: GroupModules.Module, id: string) : 
[GroupModules.Module, GroupModules.Module] {

    if( group.moduleId === id )
        return [group,parentGroup]
    
    return group.getDirectChildren()
    .filter(mdle => mdle instanceof GroupModules.Module)
    .map( (mdle:GroupModules.Module) =>{
        return getLayer(group, mdle, id)
    })[0]
}

let toHtml = (content: string) => {
    var template = document.createElement('div');
    template.innerHTML = (content as any).trim();
    return template as HTMLDivElement
}


export function applyHtmlLayout( 
    workflow: Workflow,
    html: string 
    ) : Workflow {
    
    let debugSingleton = AppDebugEnvironment.getInstance()

    let htmlDiv = toHtml(html)
    if(!htmlDiv)
        return workflow

    let componentsDiv = Array.from(htmlDiv.querySelectorAll(".flux-component"))
    .reduce( (acc,e) => {
       return {...acc, ...{[e.id]:e.cloneNode(true)}}
    }, {})

    let componentIds = Object.keys(componentsDiv)
    // we only update the components that are part of the html layout
    // others will keep they previous layout (desired)
    let componentsToEventuallyUpdate = componentIds
    .map( (componentId) => workflow.modules.find( mdle => mdle.moduleId==componentId))

    let newComponents = componentsToEventuallyUpdate.map( (component: Component.Module) => {
        let deepHtml = componentsDiv[component.moduleId]
        if(!deepHtml)
            return undefined

        let encapsulatedHtml = component.getDirectChildren()
        .filter( child => child instanceof Component.Module)
        .reduce( (htmlFinal, childComponent: Component.Module) => {
            let childComponentDiv = htmlFinal.querySelector(`#${childComponent.moduleId}`)
            if(childComponentDiv)
                childComponentDiv.innerHTML = '' 
            return htmlFinal.outerHTML
        }, deepHtml)
        .outerHTML

        if(encapsulatedHtml == component.getPersistentData<Component.PersistentData>().html)
            return undefined

        let newComponent = updateComponent(component, {html: deepHtml.outerHTML})
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

    let newWorkflow = new Workflow({
        ...workflow,
        modules: workflow.modules
        .filter( mdle => ! newComponents.find( component => component.moduleId == mdle.moduleId))
        .concat(...newComponents)
    })
    return newWorkflow
}

export function applyHtmlCss( 
    rootComponent: Component.Module,
    workflow: Workflow,
    css: string 
    ) : Workflow {

    let debugSingleton = AppDebugEnvironment.getInstance()

    let wrapDiv = (html) => {
        // the html of the current layer is appended to a wrapper div such that 
        // 'querySelectorAll' will also account for the 'Component_xxx' (root DOM) of 'html'
        let wrapperDiv = document.createElement('div')
        wrapperDiv.appendChild(html)
        return wrapperDiv
    }

    let toCss = (content: string) => {

        let styleSheet = new CSSStyleSheet()
        content.split('}')
        .filter( rule => rule!="")
        .forEach( rule => {
            styleSheet.insertRule(rule) 
        })
        return styleSheet; 
    }
    let styleSheet = toCss(css)
    let htmlRoot = wrapDiv(rootComponent.getHTML({recursive: true}))

    if(!htmlRoot)
        return workflow

    
    let newComponents = workflow.modules
    .filter( mdle => mdle instanceof Component.Module)
    // do not update the style if the element is not actually in the view
    .filter( mdle => htmlRoot.querySelector(`#${mdle.moduleId}`) != undefined)
    // fetch all the rules that applies for the component
    .map( (component: Component.Module) => {
        let html = component.getHTML({recursive:false})
        let wrapperDiv = wrapDiv(html)
        let cssRules = new Set<string>()


        for(let i=0; i<styleSheet.rules.length;i++) {
            let cssRule = styleSheet.rules[i] as any
            let elements =  Array
            .from(wrapperDiv.querySelectorAll(cssRule.selectorText))
            // The style of child components belong to the child, not the parent
            .filter( element => {
                let childrenComponentId = component
                .getDirectChildren()
                .filter( c => c instanceof Component.Module)
                .map(child => child.moduleId)
                return !childrenComponentId.includes(element.id) 
            })
            if(elements.length>0 )
                cssRules.add(cssRule.cssText)
        }
        let css : string = [...cssRules].reduce((acc: string,e: string) => acc+"\n"+e, ""); 
        if(css == component.getPersistentData<Component.PersistentData>().css)
            return undefined

        let newComponent = updateComponent(component, {css})
        return newComponent
    })
    .filter( d => d)
    debugSingleton.debugOn && 
    debugSingleton.logWorkflowBuilder( {  
        level : LogLevel.Info, 
        message: "apply css style", 
        object:{    
            newComponents
        }
    })

    let newWorkflow = new Workflow({
        ...workflow,
        modules: workflow.modules
        .filter( mdle => ! newComponents.find( component => component.moduleId == mdle.moduleId))
        .concat(...newComponents)
    })
    return newWorkflow
}


export function cloneLayerTree(
    layerTree: LayerTree, 
    filter = (mdleId:string)=>true, 
    layout = (layout: LayerTree) => layout.html,
    css = (layout: LayerTree) => layout.css ) :LayerTree {

    return  new LayerTree({
        ...layerTree,
        ...{
            children:layerTree.children.map(c => cloneLayerTree(c,filter, layout, css)),
            moduleIds: layerTree.moduleIds.filter( mId=>filter(mId)),
            html: layout(layerTree),
            css: css(layerTree)
        }
    })
}


export function cleanChildrenLayers(layerTree: LayerTree, moduleIds = undefined) : LayerTree{
    
    let children = layerTree.children.filter( c => c.moduleIds.length > 0)
    return  new LayerTree({
        ...layerTree,
        ...{
            children:  children.map( c => cleanChildrenLayers(c,moduleIds)),
            moduleIds: moduleIds ? layerTree.moduleIds.filter( m => moduleIds.includes(m) ) :layerTree.moduleIds
        }
    })
}


export function createLayer(
    title: string,
    modules: Array<ModuleFlux>,
    project:Project, 
    currentLayerId : string,
    Factory,
    configuration,
    workflowGetter,
    environment: IEnvironment
    ):{project:Project, layer:LayerTree}{
    
    let debugSingleton = AppDebugEnvironment.getInstance()
    debugSingleton.debugOn && 
    debugSingleton.logWorkflowBuilder( {  
       level : LogLevel.Info, 
         message: "createLayer", 
          object:{
            modules:modules,
            title:title
        }
    })
    
    let modulesId = modules.map( mdle=>mdle.moduleId)
    
    let newGrpMdle = new Factory.Module({
        moduleId: Factory.id.replace("@","_")+"_" + uuidv4(), 
        configuration:new ModuleConfiguration({
            title,
            description:'',
            data: new Factory.PersistentData({moduleIds:modules.map(m=>m.moduleId)})
        }),
        Factory: Factory,
        workflowGetter: workflowGetter,
        environment
    })
    let parentGroup = project.workflow.modules.find( mdle => mdle.moduleId == currentLayerId) as GroupModules.Module
    let parentGroupUpdated = updateGroup(parentGroup, {
        moduleIds:parentGroup.getModuleIds().filter( mId => !modulesId.includes(mId)).concat(newGrpMdle.moduleId)})
    
    let workflow = new Workflow({
        modules: project.workflow.modules
        .filter(mdle => mdle.moduleId != parentGroup.moduleId)
        .concat(newGrpMdle, parentGroupUpdated),
        connections:project.workflow.connections,
        plugins:project.workflow.plugins
    })

    let moduleViewsInGrp  = project.builderRendering.modulesView
    .filter( view => newGrpMdle.getModuleIds().includes(view.moduleId))
    
    let xWorld       = moduleViewsInGrp.reduce((acc,e)=> acc+e.xWorld ,0) / moduleViewsInGrp.length
    let yWorld       = moduleViewsInGrp.reduce((acc,e)=> acc+e.yWorld ,0) / moduleViewsInGrp.length    
    let moduleView   = new ModuleView(newGrpMdle.moduleId,xWorld,yWorld,Factory)
    let moduleViews  = [...project.builderRendering.modulesView,moduleView]
    
    let projectNew = new Project({
        ...project,
        ...{
            workflow,
            builderRendering: new BuilderRendering(moduleViews, project.builderRendering.connectionsView, project.builderRendering.descriptionsBoxes),
        }
    })

    return { project:projectNew, layer: undefined}
}