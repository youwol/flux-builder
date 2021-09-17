import { ImmutableTree } from '@youwol/fv-tree'
import { AppStore } from '../builder-state'
import { AssetsExplorerView } from '../views/assets-explorer.view'
import { ImportModulesView } from '../views/import-modules.view'
import { JournalsView } from '../views/journals.view'
import { ContextMenuState } from "./context-menu"


export class ContextTreeNode extends ImmutableTree.Node{

    public readonly faIcon
    public readonly name

    constructor({id, children, name, faIcon} : {id:string, children: Array<ContextTreeNode>, name:string, faIcon:string}) {
        super({id,children})
        this.name = name
        this.faIcon = faIcon
    }

    execute(state: ContextMenuState, {event}:{event: MouseEvent}){}
}

export class ContextRootNode extends ContextTreeNode{

    constructor({children} : {children: Array<ContextTreeNode>}) {
        super({id:'root',children, name:'menu list', faIcon:''})
    }

}

export class NewModulesNode extends ContextTreeNode{

    constructor() {
        super({id:'new-modules',children:undefined, name:'new module(s)', faIcon:'fas fa-microchip'})
    }
    
    execute(
        state: ContextMenuState, 
        {event} : {event: MouseEvent}
        ){ 

        let worldCoordinates = state.drawingArea.invert(event.clientX, event.clientY)  
        ImportModulesView.popupModal(
            state.appState,
            (nodes: Array<AssetsExplorerView.ModuleItemNode>) => {
                let libraries = nodes.map( node => node.library )
                let fluxPacks = nodes.flatMap( node => node.fluxPacks.map( fluxPack => fluxPack))
                state.appState.addLibraries$(libraries, fluxPacks).subscribe( () => {
                    nodes.forEach( node => state.appState.addModule(node.factory, worldCoordinates ) ) 
                })
            }
        )
    }

}

export class AddPluginsNode extends ContextTreeNode{

    constructor() {
        super({id:'add-plugins',children:undefined, name:'add plugin(s)', faIcon:'fas fa-microchip'})
    }

    execute(state: ContextMenuState, {event}:{event: MouseEvent}){ 

        ImportModulesView.popupModal(
            state.appState,
            (nodes: Array<AssetsExplorerView.ModuleItemNode>) => {
                let parentModule = state.appState.getModuleSelected()
                let libraries = nodes.map( node => node.library )
                let fluxPacks = nodes.flatMap( node => node.fluxPacks.map( fluxPack => fluxPack))
                state.appState.addLibraries$(libraries, fluxPacks).subscribe( () => {
                    nodes.forEach( node =>  state.appState.addPlugin(node.factory, parentModule ))
                })
            })
    }
}

export class JournalsNode extends ContextTreeNode{

    constructor() {
        super({id:'journals',children:undefined, name:'journals', faIcon:'fas fa-newspaper'})
    }

    execute(state: ContextMenuState){
        let module = state.appState.getModuleSelected()
        JournalsView.popupModal({module})
    }
}

export class DocumentationNode extends ContextTreeNode{

    static createChildren(appStore: AppStore){
        let resources = appStore.getModuleSelected().Factory.resources
        return Object.entries(resources).map(([name, url]) => {
            return new ResourceNode({name, url})
        })
    }
    constructor(appStore: AppStore) {
        super({id:'documentation',children:DocumentationNode.createChildren(appStore), name:'documentation', faIcon:'fas fa-book'})
    }
}

export class ResourceNode extends ContextTreeNode{

    public readonly url: string
    constructor({name, url}) {
        super({id:name,children:undefined, name:name, faIcon:'fas fa-book'})
        this.url = url

    }

    execute(state: ContextMenuState){
        window.open( this.url,'_blank')
    }
}