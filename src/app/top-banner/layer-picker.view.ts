import { createHTMLElement, LayerTree } from '@youwol/flux-core'
import { AppStore } from '../builder-editor/builder-state/index'


export function createLayerPickerView(appStore: AppStore, editor): HTMLDivElement {

  let subscriptions = []

  function createContentRecursive(layer: LayerTree) {

   // const childrenModules = layer.moduleIds.map(moduleId => ({ tag: 'div', class: "text-muted  px-1", innerText: appStore.getModule(moduleId).configuration.title }))
    const childrenLayers = layer.children.map(child => createContentRecursive(child))
    const selectedClass = layer.layerId == appStore.getActiveLayer().layerId ? "font-weight-bold" : ""
    return {
        class: "w-100",
        __label: { 
          innerText: layer.title, 
          class: "flux-hoverable w-100 px-1 "+selectedClass,
          onclick: () => appStore.selectActiveLayer(layer.layerId) 
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
          __div: createContentRecursive(appStore.project.workflow.rootLayerTree)
        }]
      },
    },
    subscriptions,
    classesDict: {
    }
  })
  return view as HTMLDivElement
}