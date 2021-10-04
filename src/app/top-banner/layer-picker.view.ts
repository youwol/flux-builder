import { createHTMLElement, GroupModules, LayerTree } from '@youwol/flux-core'
import { AppStore } from '../builder-editor/builder-state/index'


export function createLayerPickerView(appStore: AppStore, editor): HTMLDivElement {

  let subscriptions = []

  function createContentRecursive(grpMdle: GroupModules.Module) {

   // const childrenModules = layer.moduleIds.map(moduleId => ({ tag: 'div', class: "text-muted  px-1", innerText: appStore.getModule(moduleId).configuration.title }))
    const childrenLayers = grpMdle.getDirectChildren(appStore.project.workflow)
    .filter( mdle => mdle instanceof GroupModules.Module)
    .map( (child:GroupModules.Module) => createContentRecursive(child))
    const selectedClass = grpMdle.moduleId == appStore.getActiveGroup().moduleId ? "font-weight-bold" : ""
    return {
        class: "w-100",
        __label: { 
          innerText: grpMdle.configuration.title, 
          class: "flux-hoverable w-100 px-1 "+selectedClass,
          onclick: () => appStore.selectActiveGroup(grpMdle.moduleId) 
        },
        __div: {
          class: "children pl-2 w-100",
          children: childrenLayers
        }
    }
  }


  let view = createHTMLElement({
    data: {
      id: "tree-view-layers",
      class: "px-2 text-light border text-left flux-bg-primary",
      onmouseout: (event) => {
        if (event.path[0].id == "tree-view-layers") {
          const selection = document.getElementById("tree-view-layers").querySelector(".children")
          selection && selection.remove()
        }
      },
      onclick: () => {
        editor.Commands.run("display-tree-structure")
      },
      __div: {
        class: "",
        innerHTML: "active layer <i class='fas fa-caret-down pl-2'></i>",
        children: [{
          tag: 'div',
          class: 'flux-bg-primary text-black  children small py-2',
          __div: createContentRecursive(appStore.getRootComponent())
        }]
      },
    },
    subscriptions,
    classesDict: {
    }
  })
  return view as HTMLDivElement
}