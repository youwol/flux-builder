import { Component, GroupModules, LayerTree, ModuleConfiguration, Project} from '@youwol/flux-core'

export function updateGroup( original: GroupModules.Module, persistentFields : any ) : GroupModules.Module {

    let persistentData   = new original.Factory.PersistentData({
        ...original.getPersistentData(),
        ...persistentFields
    })
    let grpConfiguration = new ModuleConfiguration({...original.configuration, data: persistentData})
    let groupModuleNew = new original.Factory.Module( Object.assign({}, original, { configuration:grpConfiguration })) 
    return groupModuleNew
}

export function updateComponent( original: Component.Module, persistentFields : any ) : Component.Module {

    return updateGroup(original, persistentFields) as  Component.Module
}

export function getDisplayedModulesView(
    group: GroupModules.Module,
    parentGroup: GroupModules.Module | undefined,
    appStore,
    project:Project) {


    let modulesId = group.getModuleIds()
    let unitModulesView = project.builderRendering.modulesView.filter(moduleView => modulesId.includes(moduleView.moduleId))
    let parentUnitModulesView = []
    if (parentGroup) {
        
        let modulesId = parentGroup.getModuleIds()
        parentUnitModulesView = project.builderRendering.modulesView.filter(moduleView => modulesId.includes(moduleView.moduleId))       
    }
    return {
        parentLayer: {
            modulesView: parentUnitModulesView.filter( mView =>!mView.moduleId.includes(group.moduleId)),
            modules: parentUnitModulesView.map(view => appStore.getModule(view.moduleId)),
            currentGroupModuleView: parentUnitModulesView.find( mView =>mView.moduleId.includes(group.moduleId))
        },
        currentLayer: {
            modulesView: unitModulesView,
            modules: unitModulesView.map(view => appStore.getModule(view.moduleId))
        }
    }
}
