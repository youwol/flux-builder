import { HTMLReactiveElement } from "@youwol/flux-core";
import { ImmutableTree } from "@youwol/fv-tree"
import { ContextMenu } from "@youwol/fv-context-menu"
import { fromEvent, Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { AppStore } from '../builder-state/index';
import { DrawingArea } from "@youwol/flux-svg-plots";
import { AddPluginsNode, ContextTreeNode, NewModulesNode, 
    ContextRootNode, JournalsNode, DocumentationNode } from "./nodes";



let ALL_ACTIONS = {
    newModules: {
        createNode: ( state : AppStore) => new NewModulesNode(),
        applicable: ( state: AppStore) => state.getModulesSelected().length >= 0
    },
    addPlugins: {
        createNode: () => new AddPluginsNode(),
        applicable: ( state: AppStore) => state.getModulesSelected().length == 1
    },
    journals: {
        createNode: (state : AppStore) => new JournalsNode(),
        applicable: ( state: AppStore) => {
            return state.getModulesSelected().length == 1  &&
            state.getModuleSelected().journals.length > 0 
        }
    },
    documentation: {
        createNode: (state : AppStore) => new DocumentationNode(state),
        applicable: ( state: AppStore) => {
            if(state.getModulesSelected().length !=1 )
                {return false}
            let mdle = state.getModuleSelected()
            let resources = mdle.Factory.resources 
            return resources && Object.entries(resources).length > 0
        }
    }
}
export class ContextMenuState extends ContextMenu.State{

    public readonly htmlElement : HTMLDivElement

    constructor(
        public readonly appState : AppStore, 
        public readonly drawingArea: DrawingArea
        ){
        super( 
            fromEvent(drawingArea.parentDiv,'contextmenu').pipe(
            tap( (ev:Event)=> ev.preventDefault()) 
        ) as Observable<MouseEvent>
        )
        this.htmlElement = drawingArea.parentDiv
    }

    dispatch(ev: MouseEvent){
        
        let children = Object.values(ALL_ACTIONS)
        .filter( action => action.applicable(this.appState))
        .map( action => action.createNode(this.appState))

        let root = new ContextRootNode({children})
        let state = new ContextTreeState(root)
        
        let view = new ImmutableTree.View(
            {
                state, 
                headerView,
                class: "fv-bg-background fv-text-primary p-2 rounded"
            }as any)
        state.selectedNode$.next(root)
        state.selectedNode$.subscribe( (node) => node.execute(this, {event:ev}))
        return view
    }

}


class ContextTreeState extends ImmutableTree.State<ContextTreeNode>{

    constructor(root:ContextTreeNode ){
        super({rootNode:root, expandedNodes:  [root.id]})
    }
}

function headerView(state:ContextTreeState, node:ContextTreeNode) : HTMLReactiveElement{

    return {
        class: 'd-flex w-100 align-items-baseline fv-pointer fv-hover-bg-background-alt px-1',
        children: [
            { tag: 'i', class: node.faIcon },
            { tag: 'span', class: 'mx-2 w-100', innerText: node.name, style:{'user-select': 'none'}}
        ]
    }
}
