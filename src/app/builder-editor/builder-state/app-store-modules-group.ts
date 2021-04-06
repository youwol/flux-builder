import { LayerTree, Project} from '@youwol/flux-core'



export function getDisplayedModulesView(
    activeLayer: LayerTree,
    parentLayer: LayerTree,
    appStore,
    project:Project) {

    let modulesId = activeLayer.moduleIds
    let unitModulesView = project.builderRendering.modulesView.filter(moduleView => modulesId.includes(moduleView.moduleId))
    let parentUnitModulesView = []
    if (parentLayer) {
        
        let modulesId = parentLayer.moduleIds
        parentUnitModulesView = project.builderRendering.modulesView.filter(moduleView => modulesId.includes(moduleView.moduleId))       
    }
    return {
        parentLayer: {
            modulesView: parentUnitModulesView.filter( mView =>!mView.moduleId.includes(activeLayer.layerId)),
            modules: parentUnitModulesView.map(view => appStore.getModule(view.moduleId)),
            currentGroupModuleView: parentUnitModulesView.find( mView =>mView.moduleId.includes(activeLayer.layerId))
        },
        currentLayer: {
            modulesView: unitModulesView,
            modules: unitModulesView.map(view => appStore.getModule(view.moduleId))
        }
    }
}
