import { Component, PluginFlux, Workflow, Project, GroupModules, ModuleFlux} from '@youwol/flux-core';
import { filter } from 'rxjs/operators';
import { serializeWorkflow, toProjectData } from './factory-utils';


export function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function css(el, doc) {
    var sheets = doc.styleSheets, ret = [];
    el.matches = el.matches || el.webkitMatchesSelector || el.mozMatchesSelector 
        || el.msMatchesSelector || el.oMatchesSelector;
    for (var i in sheets) {
        var rules = sheets[i].rules || sheets[i].cssRules;
        for (var r in rules) {
            if (el.matches(rules[r]["selectorText"])) {
                ret.push(rules[r].cssText);
            }
        }
    }
    return ret;
}

  export function packageAssetComponent(component: Component.Module | GroupModules.Module, project: Project) {

    let allModules = [component, ...component.getAllChildren()]
    let modules = allModules.filter( m=>!(m instanceof PluginFlux))
    let moduleIds = modules.map( m=>m.moduleId)
    let plugins = project.workflow.plugins.filter( m=>moduleIds.includes(m.parentModule.moduleId))

    let connections = component.getConnections()
    let layer = component.getLayerTree()
    let workflow = new Workflow(modules,connections.internals, plugins, layer)

    let fluxPacks = new Set(allModules.map(m => m.Factory.packId))
    let builderRendering = {
        modulesView: moduleIds.map( mdleId => project.builderRendering.modulesView.find( mView =>mView.moduleId==mdleId)),
        connectionsView: connections.internals.map( cId => project.builderRendering.connectionsView.find( c =>c.connectionId==cId))
                                        .filter( c=>c)
    }
    
    let contentHtml = document.createElement('div')
    contentHtml.innerHTML = project.runnerRendering.layout
    let componentHtml = contentHtml.querySelector("#"+component.moduleId)
    if (!componentHtml /*component instanceof GroupModules.Module*/)
      return {
        componentId: component.moduleId,
        workflow:serializeWorkflow(workflow),
        builderRendering, 
        fluxPacks: new Array(...fluxPacks), 
      }

    let innerHtml = componentHtml ? componentHtml.outerHTML : ""

    let root = window["youwol"].renderView.document.querySelector("#"+component.moduleId) 
    var all = root.getElementsByTagName('*');
    let divs = [root]
    for (var i = -1, l = all.length; ++i < l;) {
      divs.push(all[i]);
    }
    
    let cssItems = new Set(divs
    .filter(el=>el.matches)
    .map( el => css(el, window["youwol"].renderView.document))
    .reduce( (acc,e)=> acc.concat(e),[])
    .filter( e => e[0]=="#" || e[0]=="."))
    
    return { 
        componentId: component.moduleId,
        workflow:serializeWorkflow(workflow),
        builderRendering, 
        fluxPacks: new Array(...fluxPacks), 
        runnerRendering:{layout:innerHtml,style:[...cssItems].reduce( (acc,e)=>acc+" "+e,"")}
        }
  }
  

  export function packageAssetProject(project: Project){

    let publishRequest = {
      asset:{
        name: project.name,
        description: project.description
      },
      project:toProjectData(project)
      }
    return publishRequest
  }


  export function plugBuilderViewsSignals(modules: Array<ModuleFlux>, actions, redirections$){

      modules.forEach( mdle => {

          // This should go somewhere else above at some point (when multiple FluxAppstore data will be needed) 
          if(!mdle.Factory.consumersData.FluxAppstore)
            mdle.Factory.consumersData.FluxAppstore = {notifiersPluged: false}

          // notifier is static, we subscribe only one time to it
          if(mdle.Factory.BuilderView.notifier$ && !mdle.Factory.consumersData.FluxAppstore.notifiersPluged){

              mdle.Factory.BuilderView.notifier$.pipe( 
                  filter((event:any)=>event.type=="configurationUpdated"))
              .subscribe( (event)=> {
                  actions[event.type] && actions[event.type](event.data)
              })
              mdle.Factory.BuilderView.notifier$.subscribe(d => redirections$.next(d)) 
              mdle.Factory.consumersData.FluxAppstore.notifiersPluged = true
          }
      })
  }