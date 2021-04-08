import { ConfigurationStatus, Context, ErrorLog, ExpectationStatus, Log, ModuleError, uuidv4 } from "@youwol/flux-core";
import { render, VirtualDOM } from "@youwol/flux-view";
import { Button } from "@youwol/fv-button";
import { Modal } from "@youwol/fv-group";
import { ImmutableTree } from "@youwol/fv-tree";
import { ConfigurationStatusView } from "./configuration-status.view";
import { DataTreeView } from "./data-tree.view";
import { ExpectationView } from "./expectation.view";


export namespace ContextView{


    function nodeFactory(node: Context | Log | unknown) : NodeBase {

        if( node instanceof window['@youwol/flux-core'].Context){
            return new ContextNode({context: node as Context})
        }
        if( node instanceof window['@youwol/flux-core'].ErrorLog){
            return new LogNodeError({log: node as Log})
        }
        if( node instanceof window['@youwol/flux-core'].WarningLog){
            return new LogNodeWarning({log: node as Log})
        }
        if( node instanceof window['@youwol/flux-core'].InfoLog){
            return new LogNodeInfo({log: node as Log})
        }
    }


    class NodeBase extends ImmutableTree.Node{

        constructor({id, children}:{id: string, children?:Array<NodeBase> | undefined}){
            super({id, children})
        }
    }


    class ContextNode extends NodeBase{

        public readonly context: Context
        constructor({context}: {context: Context}){
            super({ id: context.id, children: context.children.map( node => nodeFactory(node)) })
            this.context=context
        }
    }


    class DataNodeBase extends NodeBase{

        public readonly data: unknown

        constructor({data} : {data:unknown}){
            super({id:uuidv4()})
            this.data = data
        }
    }


    class LogNodeBase<T=unknown> extends NodeBase{

        public readonly log: Log

        constructor({log} : {log:Log}){
            super({ id:log.id, children:[new DataNodeBase({data:log.data})]})
            this.log = log
        }
    }


    class LogNodeInfo extends LogNodeBase{
        constructor(d){ super(d) }
    }


    class LogNodeWarning extends LogNodeBase{
        constructor(d){ super(d) }
    }


    class LogNodeError extends LogNodeBase{
        constructor(d){ super(d) }
    }


    function nodePath(node: Context)  {
        return node.parent ? nodePath(node.parent).concat([node.id]) : [node.id]
    }

    class State extends ImmutableTree.State<NodeBase>{

        public readonly tStart: number
        public readonly tEnd: number
        public readonly context: Context
        public readonly rootCtx: Context

        constructor({ context, expandedNodes, selectedNode }:
            {   
                context : Context, 
                expandedNodes: Array<string>,
                selectedNode: string
            }){
            super({
                rootNode: nodeFactory(context.root()),
                expandedNodes
            })
            this.rootCtx = context.root()
            this.context = context 
            this.tStart = this.rootCtx.startTimestamp
            this.tEnd = this.rootCtx.startTimestamp + this.rootCtx.elapsed()
            this.selectedNode$.next(this.getNode(selectedNode))
        }
    }

    type TOptions = {
        containerClass?: string,
        containerStyle?: {[key:string]: string},
        treeViewClass?: string,
        treeViewStyle?: {[key:string]: string}
    }

    export class View implements VirtualDOM{

        static defaultOptions  = {
            containerClass: 'p-4 fv-bg-background fv-text-primary border rounded',
            containerStyle: { width: "100%", height: "100%"},
            treeViewClass: 'h-100 overflow-auto',
            treeViewStyle: {}
        }
        public readonly state: State
        public readonly children: Array<VirtualDOM>

        public readonly class: string
        public readonly style: {[key:string]: string}

        constructor({
            state,
            options,
            ...rest 
        }
        : {
            state: State,
            options?: TOptions
        }){
            Object.assign(this, rest)
            this.state = state
            let styling : TOptions = {...View.defaultOptions, ...(options ? options : {}) }
            this.class = styling.containerClass
            this.style = styling.containerStyle

            let treeView = new ImmutableTree.View({
                state,
                headerView,
                class:styling.treeViewClass,
                style:styling.treeViewStyle,
            } as any)

            this.children = [
                treeView
            ]
        }
    }

    export function displayModuleErrorModal(errorLog: ErrorLog<ModuleError>){

        let context = errorLog.context

        let exitBttn = new Button.View({
            state: new Button.State(),
            contentView: () => ({ innerText: 'Exit' }),
            class: "fv-btn fv-btn-primary fv-bg-focus ml-2"
        } as any)
        
        let modalState = new Modal.State(exitBttn.state.click$, exitBttn.state.click$)

        let expandedNodes = nodePath(context).concat(errorLog.id)

        let contextViewState = new State({
            context,
            expandedNodes,
            selectedNode:  errorLog.id
        })
        let view = new Modal.View({
            state: modalState,
            contentView: () => new View({
                state: contextViewState,
                options: {
                    containerStyle:{width:'75vw', height:'75vh'}
                }
            }),
            connectedCallback: (elem) => {
                elem.subscriptions.push(
                    modalState.cancel$.subscribe( () => elem.remove())
                )
                elem.subscriptions.push(
                    modalState.ok$.subscribe( () => elem.remove())
                )
            }
        } as any)

    let modalDiv = render(view)
    document.querySelector("body").appendChild(modalDiv)
    }

    function headerView( state:State, node: NodeBase){

        let classes = 'fv-pointer'
        if (node instanceof ContextNode){
            let tStart = node.context.startTimestamp - state.rootCtx.startTimestamp
            let left =  100 * tStart / (state.tEnd - state.tStart)
            let width = 100 * node.context.elapsed() / (state.tEnd - state.tStart)
            let elapsed = Math.floor(100 * node.context.elapsed()) / 100
            return { 
                class:'w-100 pb-3',
                children:[
                    {innerText: node.context.title +`  - ${elapsed} ms`, class: classes},
                    {   class: 'fv-bg-success',
                        style: {
                            height:'5px',
                            width: width+'%',
                            position:'absolute',
                            left: left+'%'
                        }
                    }
                ]
            }
        }
        if (node instanceof LogNodeBase){

            let classes = 'fv-text-primary fas fa-info'
            
            if(node instanceof LogNodeError){
                classes = 'fv-text-error fas fa-times'
            }
            if(node instanceof LogNodeWarning){
                classes = 'fv-text-focus fas fa-exclamation'
            }
            return { 
                class: 'd-flex align-items-center',
                children:[
                    { class: classes},
                    { innerText: node.log.text, class:'px-2'}
                ]
            }
        }
        if (node instanceof DataNodeBase){

            if (node.data instanceof ConfigurationStatus){

                let dataState = new DataTreeView.State({
                    title: "merged configuration",
                    data: node.data.result
                })
                let configurationState = new ConfigurationStatusView.State({
                    status:node.data
                })

                return {
                    class: 'd-flex justify-content-around w-100',
                    style:{'white-space': 'nowrap'},
                    children: [
                        new DataTreeView.View({state: dataState}),
                        new ConfigurationStatusView.View({state:configurationState})
                    ]
                }
            }
            if (node.data instanceof ExpectationStatus){

                let dataState = new DataTreeView.State({
                    title: "incoming data",
                    data: node.data.fromValue,
                    expandedNodes: ["incoming data_0"]
                })

                let expectationState = new ExpectationView.State({
                    status: node.data
                })
                
                return {
                    class: 'd-flex justify-content-around w-100',
                    style:{'white-space': 'nowrap'},
                    children: [
                        new DataTreeView.View({state: dataState}),
                        new ExpectationView.View({ state: expectationState })
                    ]
                }
            }

            let dataState = new DataTreeView.State({
                title: "data",
                data: node.data
            })

            return {
                children: [
                    new DataTreeView.View({state: dataState})
                ]
            }
        }
        return { innerText: "unknown type"}
    }

}