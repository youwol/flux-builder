import { Connection, Contract, IExpectation, ModuleFlux } from "@youwol/flux-core";
import { child$, render, VirtualDOM } from "@youwol/flux-view";
import { BehaviorSubject, combineLatest, Observable } from "rxjs";
import { debounceTime, map } from "rxjs/operators";
import { AppStore } from "../builder-state";
import { CodeEditorView } from "./code-editor.view";
import * as _ from 'lodash'
import { infoView } from "./info.view";
import { DataTreeView } from "./data-tree.view";
import { InputStatusView } from "./input-status.view";
import { Button } from "@youwol/fv-button";
import { Modal } from "@youwol/fv-group";
import { ModalView } from "./modal.view";

export namespace AdaptorEditoView{


    class ExecutionError{
        constructor(public readonly message:string, public readonly row: number, public readonly col: number){}
    }
        
    function parseError(stack:string): ExecutionError{
    
        try{
            let lines = stack.split('\n')
            let message = lines[0]
            lines = lines.filter( line => line.includes('eval') && line.split(',').length==2)
            if(lines.length==0){
                return new ExecutionError(message, undefined, undefined)
            }
            let p = lines[0].split(',')[1].split('<anonymous>:')[1].split(')')[0]
            let [row,col] = [ Number(p.split(':')[0]) - 2, Number(p.split(':')[1]) ]
            return new ExecutionError(message, row, col)
        }
        catch(e){
            return new ExecutionError("Unidentified error", undefined, undefined)
        }
    }
    function invalidParsingView(error: ExecutionError){

        return {
            class: 'flex-grow-1 py-2', 
            style:{
                'min-height':'0px',
                'font-family': 'monospace'
            },
            children:[
                {
                    innerText: 'error while executing the adaptor'
                },
                {
                    innerText: `${error.message}.` + (error.row? ` Row:${error.row}, column:${error.col}` : '')
                }
            ]
        }
    }

    
    export class State{

        public readonly appStore: AppStore
        public readonly connection: Connection
        public readonly codeEditorState: CodeEditorView.State
        public readonly mdleStart: ModuleFlux
        public readonly mdleEnd: ModuleFlux
        public readonly contract: IExpectation<unknown>
        public readonly rawInput$: Observable<{data, configuration, context}>

        public readonly adaptedInput$ : Observable<{data, configuration, context}>

        constructor({
            connection,
            initialCode,
            appStore
        }:{
            connection: Connection,
            initialCode: string,
            appStore: AppStore
        }){
            this.appStore = appStore
            this.connection = connection
            let codeContent$ = new BehaviorSubject<string>(initialCode)
            this.codeEditorState = new CodeEditorView.State({
                content$:codeContent$
            })
            this.mdleStart = this.appStore.getModule(connection.start.moduleId)
            this.mdleEnd =  this.appStore.getModule(connection.end.moduleId) 
            this.rawInput$ = this.mdleStart.getOutputSlot(connection.start.slotId).observable$

            this.contract = this.mdleEnd.getInputSlot(this.connection.end.slotId).contract

            this.adaptedInput$ = combineLatest([
                codeContent$.pipe(debounceTime(0.5)),
                this.rawInput$
            ]).pipe(
                map( ([content, data]) => { 
                    try{
                        let result = new Function(content)()(data, this.mdleEnd.helpers)
                        result.configuration = _.merge({}, this.mdleEnd.getPersistentData(), result.configuration)
                        return result
                    }
                    catch(e){
                        return parseError(e.stack)
                    }
                })
            )
            
        }
    }

    type TOptions = {
        containerClass?: string,
        containerStyle?: {[key:string]: string},
        untilFirst?: VirtualDOM 
    }

    export class View implements VirtualDOM{

        static defaultOptions  = {
            containerClass: 'fv-bg-background p-3 fv-text-primary rounded d-flex h-100 w-100',
            containerStyle: {},
            untilFirst: {
                class:'d-flex flex-column fv-text-primary ',
                style:{'font-family': 'monospace'},
                children:[
                    {
                        tag:'p',
                        innerText: 'No data available: the module has not played any scenario yet. Having data available may help to write your code.'
                    },
                    {
                        tag:'p',
                        innerText: 'Getting some data is usually as easy as connecting the input(s) of your module.'
                    }
                ]
            }
        }
        
        public readonly state: State
        public readonly class: string
        public readonly style: {[key:string]: string}
        public readonly children: Array<VirtualDOM>
        public readonly options: TOptions


        constructor({
            state,
            options,
            ...rest
        }: {
            state: State,
            options?: TOptions
        }) {
            Object.assign(this, rest)

            this.options = {...View.defaultOptions, ...(options ? options : {}) }
            this.state = state
            this.class = this.options.containerClass
            this.style = this.options.containerStyle 
            
            this.children = [
                this.dataColumnView(),
                { 
                    class:'d-flex flex-grow-1 flex-column h-100 w-100 mx-2',
                    style: {'min-width': '0px'},
                    children:[
                        new CodeEditorView.View({
                            state: state.codeEditorState,
                            options:{
                                containerClass:'w-100 h-50'
                            }
                        }),
                        this.statusView()
                    ]
                }
            ]
        }

        dataColumnView() : VirtualDOM{

            return {
                class:'d-flex flex-column h-100 fv-text-primary w-50',
                style:{'font-family': 'monospace'},
                children:[
                    this.rawInputView(),
                    this.adaptedInputView()
                ]
            }
        }

        statusView() : VirtualDOM{
                        
            let info = "Presented here is a blind test of the input that is reaching the module's implementation "+
            "with respect to its internal validation rules. \n Make sure the trigger turn green before updating the adaptor."
            
            return { 
                style:{height:'33%', 'font-family': 'monospace'},
                class:'overflow-auto flex-grow-1 d-flex flex-column',
                children:[
                    infoView(info),
                    child$(
                        this.state.adaptedInput$,
                        ( input ) => {

                            if (input instanceof ExecutionError)
                                return invalidParsingView(input)

                            let state = new InputStatusView.State({
                                mdle: this.state.mdleEnd,
                                adaptedInput: input,
                                contract: this.state.contract
                            })
                            return new InputStatusView.View({
                                state,
                                options:{
                                    containerClass:'flex-grow-1 w-100 overflow-auto',
                                    containerStyle:{'min-height':'0px'}
                                }
                            })
                        }
                    )
                ]
            }
        }


        
        rawInputView() : VirtualDOM{

            let info = "Presented here is the latest input that have reached the adaptor, before any transformation. "+
                       "The input that is actually reaching the module's implementation is presented below."

            return {   
                class:'h-50 d-flex flex-column overflow-auto py-1',
                children:[
                    {
                        innerText: "Adaptor's input data", 
                        class:'text-center fv-text-focus'
                    },                            
                    {
                        class:'flex-grow-1 d-flex flex-column', style:{'min-height':'0'},
                        children:[
                            infoView(info),
                            this.dataTreeView(this.state.rawInput$, 'input')
                        ]
                    }
                ]
            }
        }

        adaptedInputView() : VirtualDOM{

            let info = "Presented here is the input that is actually reaching the module's implementation. "+
            "Here, the configuration part of the input is merging the default one (defined in module's settings) "+
            "with the one returned by the adaptor (as presented in the previous tab)."
            
            return {   
                class:'h-50 d-flex flex-column overflow-auto py-1',
                children:[
                    {
                        innerText: "Module's input data", 
                        class:'text-center  fv-text-focus'
                    },
                    {
                        class:'flex-grow-1 d-flex flex-column', style:{'min-height':'0'},
                        children:[
                            infoView(info),
                            this.dataTreeView( 
                                this.state.adaptedInput$, 
                                'input'
                            )
                        ]
                    }
                ]
            }
        }

        dataTreeView( input$: Observable<{data, configuration, context}>, rootNodeName){
   
            let expandedNodes = [rootNodeName+"_0"]

            return {
                class:'cm-s-blackboard overflow-auto flex-grow-1', style:{'min-height':'0px'},
                children:[
                    child$(
                        input$,
                        (result) => {
                            if(!result)
                                return { 'innerText': 'code not valid', class:'p-3'}
        
                            let treeState = new DataTreeView.State({
                                title: rootNodeName,
                                data: result,
                                expandedNodes:expandedNodes
                            } as any)
        
                            let treeView = new DataTreeView.View({
                                state: treeState,
                                connectedCallback: (elem) => {
                                    elem.subscriptions.push(
                                        treeState.expandedNodes$.subscribe( nodes => expandedNodes = nodes)
                                    )
                                }
                            } as any)
        
                            return treeView
                        },
                        { untilFirst: this.options.untilFirst }
                    )
                ]
            }
        }
    }

    export function popupModal({
        connection, 
        initialCode,
        appStore,
        onUpdate
    }: {
        connection: Connection, 
        initialCode: string,
        appStore: AppStore,
        onUpdate: (string) => void
    }){
        let state = new State({connection, initialCode, appStore})
        let view = new View({
            state: state, 
            options:{
                containerClass: 'p-3 d-flex flex-grow-1 w-100',
                containerStyle: {'min-height':'0px'}
            }
        })
        ModalView.popup({
            view,
            style: { height:'50vh', width:'90vw', 'max-width':'1500px'}
        }).subscribe( () => {
            onUpdate( state.codeEditorState.content$.getValue())
        })
    }
}