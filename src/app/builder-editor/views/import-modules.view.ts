import { child$, VirtualDOM } from "@youwol/flux-view"
import { Button } from "@youwol/fv-button"
import { BehaviorSubject, Subject } from "rxjs"
import { scan } from "rxjs/operators"
import { AppStore } from "../builder-state"
import { AssetsExplorerView } from "./assets-explorer.view"
import { ModalView } from "./modal.view"



export namespace ImportModulesView{

    class State{

        buffer$ = new BehaviorSubject<Array<AssetsExplorerView.ModuleItemNode>>([])
        ok$ : Subject<MouseEvent>
        explorerState:  AssetsExplorerView.State

        constructor({
            ok$
        }:{
            ok$: Subject<MouseEvent>
        }){
            this.ok$ = ok$
            this.explorerState = AssetsExplorerView.singletonState
            this.explorerState.selectionBuffer$ = this.buffer$
        }
    }


    type TOptions = {
        containerClass?: string,
        containerStyle?: {[key:string]: string}
    }


    export class View implements VirtualDOM{

        static defaultOptions  = {
            containerClass: 'h-100 w-100 p-3 rounded d-flex solid rounded',
            containerStyle: {},
        }

        public readonly state: State
        public readonly class: string
        public readonly style: {[key:string]: string}
        public readonly options: TOptions
        
        public readonly children: Array<VirtualDOM>
        public readonly connectedCallback: (elem) => void

        constructor({
            state,
            options,
            ...rest
        }:
        {
            state: State,
            options?: TOptions
        }) {
            Object.assign(this, rest)
            this.options = {...View.defaultOptions, ...(options ? options : {}) }
            this.state = state
            this.class = this.options.containerClass
            this.style = this.options.containerStyle

            this.children = [
                this.bufferColumnView(),
                this.explorerView()
            ]

            this.connectedCallback = (elem) =>{

                elem.subscriptions.push(
                    this.state.explorerState.selection$.pipe( 
                        scan( (acc, {node,selected}) => [...acc.filter( e => e != node), ...(selected?[node]:[])], [])
                    ).subscribe( d => this.state.buffer$.next(d))
                )    
            }
        }

        bufferColumnView(){
            
            const okBttnView = new Button.View({
                state: new Button.State(this.state.ok$),
                contentView: ()=> ({innerText:'Import'}),
                class:"fv-btn fv-btn-primary fv-bg-focus"
            } as any)
                
            return {
                class: 'px-2 d-flex flex-column w-25', style:{width:'200px'},
                children:[
                    { 
                        class:'w-100 text-center',
                        innerText: 'selection buffer', 
                        style:{'font-family': 'fantasy'}
                    },
                    child$(
                        this.state.buffer$,
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
                                                onclick: () => {
                                                    this.state.explorerState.selection$.next({node, selected: false}) 
                                                }
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
                        this.state.buffer$,
                        (nodes) => nodes.length>0 ? okBttnView : {}
                    )
                ]
            }
        }

        explorerView(){

            const view = new AssetsExplorerView.View( {
                state: this.state.explorerState,
                class: 'h-100'
            }as any)
        
            return {
                class:'h-100 overflow-auto w-75 border rounded',
                children: [
                    view
                ]
            }
        }
    }
    
    export function popupModal(
        appStore: AppStore,
        onImport: (Factory)=> void 
        ) {
        const import$ = new Subject<MouseEvent>()
        const state = new State({
            ok$:import$
        })
        const view =  new View({state:state})

        ModalView.popup({
            view,
            ok$: import$,
            options: {displayOk: false, displayCancel: false}
        }).subscribe( () => {
            onImport(state.buffer$.getValue())
        })
    }

}