import { AppDebugEnvironment, LogLevel, AppStore } from '../builder-editor/builder-state/index'
import { ModuleFlow, Component } from '@youwol/flux-core'

declare var _ : any

export let privateClasses = ["flux-element","flux-component","flux-fill-parent"]

export function cleanCss(css: string): string {
  let rules = [...new Set(css.split("}"))].filter(r => r.length > 0).map(r => r + "}")
  return rules.reduce((acc: string, e: string) => acc + e, "")
}

export function getAllComponentsRec(editor, component = undefined) {

  const getAllComponents = (model, result = []) => {

    result.push(model);
    model.components().each(mod => getAllComponents(mod, result))
    return result;
  }
  component = component || editor.DomComponents.getWrapper()
  let rList = getAllComponents(component);
  return rList.reduce( (acc,e)=>Object.assign({},acc,{[e.ccid]:e}),{})
}

export function removeTemplateElements(modules: Array<ModuleFlow>,editor) {

  let allGjs = getAllComponentsRec(editor)
  let modulesToRemove = modules
  .filter((m:ModuleFlow)=>m.Factory.RenderView )
  
  let debugSingleton = AppDebugEnvironment.getInstance()
  debugSingleton.debugOn &&
    debugSingleton.logRenderTopic({
      level: LogLevel.Info,
      message: `removeTemplateElements`,
      object: { modules, modulesToRemove }
    })

  modulesToRemove
  .filter( mdle =>  allGjs[mdle.moduleId])
  .forEach( mdle => allGjs[mdle.moduleId].remove())
}

export function replaceTemplateElements(moduleIds: Array<string>, editor:any, appStore:any): Array<ModuleFlow> {
  
  let allGjsComponents = getAllComponentsRec(editor)

  let doc   = editor.Canvas.getDocument() as HTMLDocument
  let mdles = moduleIds
  .map((mid) => appStore.getModule(mid))
  .filter( mdle => mdle.Factory.RenderView )
  let elemsGenerator = mdles.map(mdle => () => new mdle.Factory.RenderView(mdle))

  let parentDivs = mdles.map((m) => doc.getElementById(m.moduleId) as HTMLDivElement)
  let toRender = _.zip(mdles, elemsGenerator, parentDivs)
  .filter( ([,, parentDiv] : [any,any,any]) => parentDiv )// Typically when undoing a module deletion => the div is not re-inserted
  .filter( ([mdle]) => !(mdle instanceof Component.Module))
  .map( ([mdle, generator, parentDiv]) => [mdle, parentDiv,  generator().render()])
  .filter( ([,, renderView]) => renderView)

  let debugSingleton = AppDebugEnvironment.getInstance()
  debugSingleton.debugOn &&
    debugSingleton.logRenderTopic({
      level: LogLevel.Info,
      message: `replaceTemplateElements`,
      object: { mdles, toRender }
    })

  let rendered = toRender.map(([mdle, parentDiv, renderView] ) => {
    
    if (parentDiv.children[0] != undefined)
      parentDiv.children[0].remove()
    parentDiv.appendChild(renderView)
    if(mdle["renderedElementDisplayed$"] && renderView ){
      mdle["renderedElementDisplayed$"].next(renderView)
    }
    return mdle
  })

  let components =  _.zip(mdles, elemsGenerator, parentDivs)
  .filter( ([mdle]) => mdle instanceof Component.Module)

  let getDepth = (elem,depth) => (elem==null || elem.parentNode==null) ? depth : getDepth(elem.parentNode,depth+1)
  components
  .map( ([mdle,_,div]) => [mdle,div,getDepth(div, 0)])
  .sort( (a,b) => b[2] - a[2])
  .forEach( ([mdle]) => {
    let renderedDiv = doc.getElementById(mdle.moduleId);
    renderedDiv && mdle["renderedElementDisplayed$"].next(renderedDiv)
  })

  mdles.forEach( mdle => allGjsComponents[mdle.moduleId] ? allGjsComponents[mdle.moduleId].attributes["name"] = mdle.configuration.title : undefined)

  if(appStore.project.runnerRendering.layout !== localStorage.getItem("gjs-html"))
    appStore.setRenderingLayout(localStorage.getItem("gjs-html"),false)

  return rendered
}


export function getDynamicBlockWrapperDiv(mdle:ModuleFlow){

  let attr =  mdle.Factory.RenderView.wrapperDivAttributes

  let classes = `flux-element` +
    (mdle instanceof Component.Module ? " flux-component" : "") + 
    (attr &&  attr(mdle).class ?  " "+attr(mdle).class: "")

  let styles = attr &&  attr(mdle).style ?  attr(mdle).style: {}
  let styleStr = Object.entries(styles).reduce( (acc,[k,v])=> acc+k+":"+v+";", "" )
  return `<div id="${mdle.moduleId}" class="${classes}" style="${styleStr}" data-gjs-name="${mdle.configuration.title}" ></div>`
}


export function addComponentPlaceholder(appStore, editor, allGjsComponents, mdle)  {
  // the component is added in the parent component corresponding to the right group, if any
  let container = appStore.getParentGroupModule(mdle.moduleId)
  let htmlContent = getDynamicBlockWrapperDiv(mdle)

  if(mdle instanceof Component.Module && mdle.rendering){
    htmlContent = mdle.rendering.layout
    editor.getStyle().add(mdle.rendering.style)
    mdle.rendering = undefined
  }

  if( editor.fluxCache[mdle.moduleId])
    htmlContent = editor.fluxCache[mdle.moduleId].layout 
    
  if(!container)
    return editor.DomComponents.getComponents().add(htmlContent, { at: 0 })

  if(allGjsComponents[container.moduleId])
    return allGjsComponents[container.moduleId].append(htmlContent, { at: 0 })
}

export function autoAddElementInLayout(diff:{removedElements: Array<ModuleFlow>, createdElements: Array<ModuleFlow>}, editor:any, appStore:AppStore) {

  let views = diff.createdElements
  .filter((mdle:ModuleFlow)=>mdle.Factory.RenderView )
  let removedIds = diff.removedElements.map(m =>m.moduleId)
  
  let news = views
  .filter((mdle:ModuleFlow)=>!removedIds.includes(mdle.moduleId) )
   // element are added automatically only if in the root layer
   // it also allows to handle the case of a group actually not displayed
  .filter((mdle:ModuleFlow)=> appStore.project.workflow.rootLayerTree.moduleIds.includes(mdle.moduleId) )

  let toReplace = views
  .filter((mdle:ModuleFlow)=>removedIds.includes(mdle.moduleId) )

  if(toReplace.length>0)
    replaceTemplateElements(toReplace.map( mdle=>mdle.moduleId),editor, appStore)
    
  if(news.length==0)
    return 

  let allGjsComponents = getAllComponentsRec(editor)
  let modules = news.filter( (mdle)=> !allGjsComponents[mdle.moduleId])

  let components = modules.filter( mdle => mdle instanceof Component.Module ) as Array<Component.Module>
  let unitModules = modules.filter( mdle => !(mdle instanceof Component.Module) )

  let debugSingleton = AppDebugEnvironment.getInstance()
  debugSingleton.debugOn &&
    debugSingleton.logRenderTopic({
      level: LogLevel.Info,
      message: "auto add elements in layout",
      object: { unitModules, components }
    })

  unitModules.forEach( (mdle: ModuleFlow) => addComponentPlaceholder(appStore, editor, allGjsComponents,mdle) )
  
  let allChildrenId = components.reduce( (acc,mdle:Component.Module) => acc.concat(mdle.getAllChildren().map(m=>m.moduleId)), [])

  components.forEach( (mdle : Component.Module) => {
    let parentComponent = addComponentPlaceholder(appStore, editor, allGjsComponents, mdle)

    if( !editor.fluxCache[mdle.moduleId]) {
      // if the component was not in the cache => we remove children (likely already in the wrapper div), and add them in the right gjs-component
      let childComponents = mdle.getDirectChildren().map( m => allGjsComponents[m.moduleId] ).filter( elem=>elem)    
      childComponents.forEach( childComponent=> { 
        childComponent.remove()
        parentComponent.append(childComponent)
      })
    }
  })

  replaceTemplateElements(unitModules.map( mdle=>mdle.moduleId).concat(allChildrenId),editor, appStore)

  updateFluxCache(appStore, editor)
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



export function updateFluxCache(appStore: AppStore, editor){

  let debugSingleton = AppDebugEnvironment.getInstance()
  
  let componentsMdle = appStore.project.workflow.modules.filter( m => m instanceof Component.Module) 
  let gjsComponents = getAllComponentsRec(editor)

  let renderedFluxComponents = componentsMdle
  .filter( mdle=>gjsComponents[mdle.moduleId] )

  let update = renderedFluxComponents
  .reduce( (acc,e) => {

    let styles = {}/*Object.values(getAllComponentsRec(editor, gjsComponents[e.moduleId]))
    .map( (c:any) => c.getEl() )
    .filter(el=> el && el.matches)
    .map( el => css(el, editor.Canvas.getDocument() ))
    .reduce( (acc,e)=> acc.concat(e),[])
    .filter( e => e[0]=="#" )
    .reduce( (acc,e)=> acc+" "+e,"")*/
    
    let layout = gjsComponents[e.moduleId].toHTML()
    return Object.assign({},acc,{[e.moduleId]:{ layout, styles}})}, 
    editor.fluxCache 
  )

  editor.fluxCache = Object.assign({},editor.fluxCache, update)
  
  debugSingleton.debugOn &&
    debugSingleton.logRenderTopic({
      level: LogLevel.Info,
      message: "updateFluxCache",
      object: { cache: editor.fluxCache }
    })
  
}