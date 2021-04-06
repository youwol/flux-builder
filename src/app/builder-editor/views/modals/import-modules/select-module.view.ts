import { Factory } from "@youwol/flux-core";
import { VirtualDOM, render, child$, attr$} from "@youwol/flux-view";
import {Modal} from "@youwol/fv-group"
import {Tabs} from "@youwol/fv-tabs"
import {Button} from "@youwol/fv-button"
import {ImmutableTree} from "@youwol/fv-tree"
import { ContextMenuState } from "../../../context-menu/context-menu";
import { AssetsBrowserClient } from "../client";
import { ExplorerTreeState, ExplorerTab, ModalState, ModuleItemNode, 
    SuggestionsTab, TabsState, ExplorerTreeNode, FavoriteNode, AssetFolderNode } from "./states";


export function selectModuleModal(
    contextMenuState: ContextMenuState,
    onImport: (Factory)=> void ) {

    let assetsExplorerState: ExplorerTreeState= contextMenuState.appState['assetsExplorerState']
    assetsExplorerState.clearBuffer()
    let modalState = new ModalState(onImport, assetsExplorerState)
    AssetsBrowserClient.appStore = contextMenuState.appState

    let tabsState = new TabsState(contextMenuState,modalState)
    let tabsView = new Tabs.View({
        state: tabsState,
        contentView: tabContentView,
        headerView: (state, tabData) => { return {innerText:tabData.name, class:'px-2'}},
        class:'d-flex flex-column flex-grow-1',
        options:{
            containerClass: "border flex-grow-1 w-100 h-25"
        }
    } as any)

    let content = {
        class: 'fv-bg-background p-3 fv-text-primary rounded d-flex ',
        style:{
            "height":`${0.95 * contextMenuState.htmlElement.clientHeight}px`,
            "max-height":`${0.95 * contextMenuState.htmlElement.clientHeight}px`,
            'min-width':'50vh',
            border: "solid"},
        children: [
            bufferColumnView(modalState),
            tabsView
        ]
    } as VirtualDOM

    //let drawingAreaRect = contextMenuState.htmlElement.getBoundingClientRect()

    let view = new Modal.View({
        state: modalState,
        contentView: () => content
    }as any)
    let modalDiv = render(view)
    document.querySelector("body").appendChild(modalDiv)
    modalState.cancel$.subscribe( () => modalDiv.remove() )
    modalState.ok$.subscribe( () => modalDiv.remove() )
}


export function bufferColumnView(modalState: ModalState){

    let okBttnView = new Button.View({
        state: new Button.State(modalState.ok$),
        contentView: ()=> ({innerText:'Import'}),
        class:"fv-btn fv-btn-primary fv-bg-focus"
    } as any)
        
    return {
        class: 'px-2 d-flex flex-column', style:{width:'200px'},
        children:[
            { 
                class:'w-100 text-center',
                innerText: 'selection buffer', 
                style:{'font-family': 'fantasy'}
            },
            child$(
                modalState.explorerState.buffer$,
                (nodes) => {
                    if (nodes.length > 0) {
                        return {
                            class: 'd-flex flex-column flex-grow-1 overflow-auto',
                            children: nodes.map( node => ({
                                class: 'd-flex align-items-center',
                                children:[
                                    {   innerText: node.name },
                                    { 
                                        class: 'fas fa-times px-2 yw-hover-opacity yw-pointer',
                                        onclick: () => modalState.explorerState.selection$.next({node, selected: false}) 
                                    }
                                ]                                
                            }))
                        }
                    }
                    return { 
                        tag:'div', class:'py-2',
                        innerText:'Pick one or more module(s) using the tabs on the right side to add them in your worksheet',
                        style: {'font-style': 'italic', 'text-align': 'justify'}
                    }
                }
            ),      
            child$(      
                modalState.explorerState.buffer$,
                (nodes) => nodes.length>0 ? okBttnView : {}
            )
        ]
    }
}


function tabContentView(tabsState: TabsState, tabData: Tabs.TabData){

    if( tabData instanceof ExplorerTab)
        return explorerView(tabsState)
    if( tabData instanceof SuggestionsTab)
        return suggestionsView(tabsState)
    return undefined
}


function explorerView(tabsState: TabsState){

    let treeState : ExplorerTreeState = tabsState.contextMenuState.appState['assetsExplorerState']
    let view = new ImmutableTree.View( {
        state:treeState, 
        headerView: assetsTreeHeaderView,
        class: 'h-100'
    }as any)

    treeState.expandedNodes$.subscribe( nodes => {
        treeState.expandedNodes = nodes
    })
    return {
        class:'h-100 overflow-auto',
        children: [
            view
        ]
    }
}


function suggestionsView(tabsState: TabsState){

    return {
        class:'h-100 w-100 text-center d-flex flex-column justify-content-center',
        children:{
            content:{
                class:' w-100 ',
                children:[
                    {tag:'i', class:'w-100', innerText:'Coming soon...', style:{'font-family':'fantasy', 'font-size':'xx-large'}},
                    {tag:'i', class:'far fa-sad-cry fa-2x'}
                ]
            }
        }
    }
}


function assetsTreeHeaderView(state: ExplorerTreeState, node: ExplorerTreeNode) {

    if( !(node instanceof ModuleItemNode)){
        let favoriteClassBase = 'fas fa-star fa-xs fv-hover-opacity fv-pointer '
        return {
            class: 'd-flex w-100 align-items-center fv-pointer',
            children: [
                { 
                    tag: 'i', 
                    class: node.faIcon ? node.faIcon : "" 
                },
                node instanceof FavoriteNode 
                    ?{ 
                        tag: 'i', class: 'fas fa-star fa-xs px-1 fv-text-focus fv-hover-opacity',
                        onclick: (ev) => { ev.stopPropagation(); state.toggleFavorite(node)}
                     }
                    :{}, 
                { 
                    tag: 'span', 
                    class: 'mx-2', 
                    innerText: node.name, 
                    style: { 'user-select': 'none' } 
                },
                node instanceof AssetFolderNode
                    ? { 
                        tag:'i',
                        class: attr$(
                            ExplorerTreeState.favorites$,
                            (favorites) =>  favorites.find( f => f.id ==node.id)
                                ? favoriteClassBase + "fv-text-focus" 
                                : favoriteClassBase + "fv-text-primary" 
                        ),
                        onclick: (ev)=> {
                            ev.stopPropagation();
                            state.toggleFavorite(node)
                        }
                    }
                    : {},
                child$(
                    node.status$,
                    (statusList) => statusList.find(status => status.type == 'request-pending')
                        ? { tag: 'i', class: 'fas fa-spinner fa-spin' }
                        : {}
                )
            ]
        }
    }
    if( node instanceof ModuleItemNode){
        return {
            class: 'd-flex w-100 align-items-baseline fv-pointer',            
            onclick: () => state.selection$.next({node:node, selected: true}), 
            children: [
                { 
                    tag:'i', 
                    class: attr$(
                        state.buffer$,
                        (buffer: Array<ModuleItemNode>) => buffer.includes(node) ? 'fv-text-focus': '',
                        { wrapper: (d) => 'fas fa-cloud-download-alt fv-text-primary fv-hover-opacity '+d}
                    )
                },
                { 
                    tag: 'span', 
                    class: 'mx-2 w-100', 
                    innerText: node.name, 
                    style: { 'user-select': 'none' } 
                }
            ]
        } 
    }
}

function addToFavorite(state: ExplorerTreeState, node: ExplorerTreeNode){

}