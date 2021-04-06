import { ImmutableTree } from '@youwol/fv-tree'
import { selectModuleModal } from "../views/modals/import-modules/select-module.view"
import { ModuleItemNode } from "../views/modals/import-modules/states"
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
        selectModuleModal(
            state,
            (nodes: Array<ModuleItemNode>) => {
                let libraries = nodes.map( node => node.library )
                state.appState.addLibraries$(libraries).subscribe( () => {
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

        selectModuleModal(
            state,
            (nodes: Array<ModuleItemNode>) => {
                let parentModule = state.appState.getModuleSelected()
                let libraries = nodes.map( node => node.library )
                state.appState.addLibraries$(libraries).subscribe( () => {
                    nodes.forEach( node =>  state.appState.addPlugin(node.factory, parentModule ))
                })
            })
    }
}


export class HelpNode extends ContextTreeNode{
    constructor() {
        super({id:'help',children:undefined, name:'help', faIcon:'fas fa-question'})
    }
    execute(state: ContextMenuState){ console.log("HelpNode")}
}

