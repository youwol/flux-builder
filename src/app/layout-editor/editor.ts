
import { ModuleFlux } from '@youwol/flux-core'

import { AppDebugEnvironment, LogLevel, AppStore } from '../builder-editor/builder-state/index'

import { getRenderPanels } from './panels'
import { getGeneralPanels } from '../top-banner/panels'
import { commandsGeneral } from '../top-banner/commands'

import { getBlocks } from './blocks'
import { getStylesSectors } from './style-manager'
import { plugCommands } from './commands'
import { commandsBuilder } from '../builder-editor/commands'
import { getBuilderPanels } from '../builder-editor/panels'
import { applyPatches } from './patches'
import { Subject } from 'rxjs'
import { updateFluxCache, getAllComponentsRec, privateClasses, getDynamicBlockWrapperDiv } from './utils'
import { take } from 'rxjs/operators'

import * as grapesjs from 'grapesjs'


export async function createLayoutEditor() : grapesjs.Editor {
  localStorage.setItem("gjs-components", "")
  localStorage.setItem("gjs-html", "")
  localStorage.setItem("gjs-css",  "")
  localStorage.setItem("gjs-styles", "")
  
  let debugSingleton = AppDebugEnvironment.getInstance()
  debugSingleton.debugOn &&
    debugSingleton.logRenderTopic({
      level: LogLevel.Info,
      message: "create layout editor",
      object: {}
    })

  let editor$ = new Subject<any>()

  let editor = grapesjs.init({
    autorender: false,
    container: '#gjs',
    canvas: {
      styles: [], //getCssRessources(appStore),
      scripts: []
    },
    height: '100%',
    width: 'auto',
    panels: { defaults: []},
    assetManager: {
      assets: [],
      autoAdd:1
    },/*
    storageManager: {
      id: 'gjs-',             // Prefix identifier that will be used inside storing and loading
      type: 'local',          // Type of the storage
      autosave: true,         // Store data automatically
      autoload: true,         // Autoload stored data on init
      stepsBeforeSave: 1,     // If autosave enabled, indicates how many changes are necessary before store method is triggered
      storeComponents: true,  // Enable/Disable storing of components in JSON format
      storeStyles: true,      // Enable/Disable storing of rules in JSON format
      storeHtml: true,        // Enable/Disable storing of components as HTML string
      storeCss: true,         // Enable/Disable storing of rules as CSS string
    },*/
    keymaps: {
      defaults:{}             // remove default keymaps - especially to remove delete map
    },
    commands: {
      defaults: []
    },
    selectorManager: {
      appendTo: '#styles'
    },
    blockManager: {
      appendTo: '#blocks',
      blocks:   getBlocks()
    },
    styleManager: {
      appendTo: '#styles',
      sectors: getStylesSectors()
    },
    layerManager: { appendTo: '#layers', },
    traitManager: { appendTo: '#traits', },
  });

  editor.dynamicModulesId = []
  editor.fluxCache = {}
  
  let bootstrapCss = document.getElementById("bootstrap-css")
  if(!bootstrapCss)
    console.error("Bootstrap css needs to be included in host application with id 'bootstrap-css' ")
  let fontawesomeCss = document.getElementById("fontawesome-css")
  if(!fontawesomeCss)
      console.error("Fontawesome css needs to be included in host application with id 'fontawesome-css' ")
  let youwolCss = document.getElementById("youwol-css")
  if(!youwolCss)
    console.error("Fontawesome css needs to be included in host application with id 'fontawesome-css' ")

  editor.on('load', function() { 
    let document = editor.Canvas.getDocument() as HTMLDocument
    let headElement = document.head  as HTMLHeadElement   
    headElement.appendChild(bootstrapCss.cloneNode()) 
    headElement.appendChild(fontawesomeCss.cloneNode())  
    headElement.appendChild(youwolCss.cloneNode())  
   
    var node = document.createElement('style');
    node.innerHTML = `.mw-50px{ min-width:50px}.w-5{width:5%};.w-10{width:10%}.w-15{width:15%}.w-20{width:20%}.w-30{width:30%}.w-40{width:40%}.w-60{width:60%}.w-70{width:70%}.w-80{width:80%}.w-90{width:90%}.zindex-1{z-index:1}
    .flux-component{min-height:50px;} .preview .gjs-hovered{outline:0px !important} .preview .gjs-selected{outline:0px !important} 
    .flux-builder-only{opacity:0.5} .flux-builder-only.preview{ display:none}
    .flux-fill-parent{width:100%; height:100%}`;
    document.body.appendChild(node);
    editor$.next(editor)
    editor.SelectorManager.getAll().each(selector => selector.set('private', privateClasses.includes(selector.id)));
  })
  editor.render();
  return new Promise( (successCb) => editor$.pipe(take(1)).subscribe( (edtr) => successCb(edtr)) )
}


export function initLayoutEditor(
  editor: grapesjs.Editor, 
  {style,layout,cssLinks} :{style:any,layout:any,cssLinks:any},
   appStore: AppStore
   ) {

  let debugSingleton = AppDebugEnvironment.getInstance()
  
  debugSingleton.debugOn &&
    debugSingleton.logRenderTopic({
      level: LogLevel.Info,
      message: "initialize layout editor",
      object: {}
    })

  plugCommands(editor, appStore)
  let builderCommands = commandsBuilder().concat(commandsGeneral(appStore, editor))
  builderCommands.forEach(c => editor.Commands.add(c[0], c[1]))
  editor.BlockManager.getCategories().each( (ctg:any) => ctg.set('open', false))
    
  let panels = [...getGeneralPanels(appStore),...getRenderPanels(),...getBuilderPanels()]
  panels.forEach( p=> editor.Panels.addPanel(p))
    
  applyPatches(editor)
  updateFluxCache(appStore,editor)
  editor.SelectorManager.getAll().each(selector => selector.set('private', privateClasses.includes(selector.id)));
  editor.setComponents(layout);
  editor.setStyle(style);
}


function scaleSvgIcons(g:any) {
  if (g.style.transform)
    return
  let parentBRect = g.parentElement.getBoundingClientRect()
  let bRect = g.getBoundingClientRect()
  let ty = parentBRect.top - bRect.top
  let tx = parentBRect.left - bRect.left
  let scale = Math.min(parentBRect.width / bRect.width, parentBRect.height / bRect.height)
  g.style.transform = `translate(${parentBRect.width / 4}px,${parentBRect.height / 4}px) scale(${0.5 * scale}) translate(${tx}px,${ty}px)`;
}

export function setDynamicComponentsBlocks( appStore: AppStore, editor: grapesjs.Editor ) {

  let debugSingleton = AppDebugEnvironment.getInstance()
  let all = getAllComponentsRec(editor)

  let layerModuleIds = appStore.getActiveLayer().moduleIds
  let pluginIds = appStore.project.workflow.plugins
  .filter( plugin => layerModuleIds.includes(plugin.parentModule.moduleId))
  .map( plugin=>plugin.moduleId)

  let modulesToRender = [...layerModuleIds, ...pluginIds]
  .filter( mid => !all[mid])
  .map( mid => appStore.getModule(mid)).filter(m => m.Factory.RenderView)

  let componentBlocks = editor.BlockManager.getAll().filter( block=> block.get('category').id=="Components")
  debugSingleton.debugOn &&
    debugSingleton.logRenderTopic({
      level: LogLevel.Info,
      message: "set dynamic components block",
      object: { modulesToRender, componentBlocks}
    })
  componentBlocks.forEach( block=> editor.BlockManager.remove(block.id))
  modulesToRender.forEach( m =>  editor.BlockManager.add(m.moduleId, toDynamicBlock(m)) )
}

function toDynamicBlock(mdle :ModuleFlux){
  
  return {
    id: mdle.moduleId,
    label: mdle.configuration.title,
    content: getDynamicBlockWrapperDiv(mdle),
    activate: true,
    category: "Components",
    render: ({ el } : {el:any} ) => {
      let div = document.createElement("div")
      div.id = mdle.moduleId
      el.appendChild(div)
      let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", "100px");
      svg.setAttribute("height", "70px");
      let item = new mdle.Factory.BuilderView().icon()

      const g = document.createElementNS("http://www.w3.org/2000/svg", "g")
      g.style.stroke = "currentColor"
      g.classList.add("group-target")
      g.innerHTML = item.content
      svg.appendChild(g)
      div.appendChild(svg)
      document.body.appendChild(svg)
      scaleSvgIcons(g)
      svg.remove()
      div.appendChild(svg)
    }
  }
}