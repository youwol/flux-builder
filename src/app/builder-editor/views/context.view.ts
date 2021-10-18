import { Context, Log, uuidv4, ContextStatus, Journal } from "@youwol/flux-core";
import { VirtualDOM } from "@youwol/flux-view";
import { ImmutableTree } from "@youwol/fv-tree";
import { DataTreeView } from "./data-tree.view";
import { ModalView } from "./modal.view";


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
            super({ id:log.id, children:log.data != undefined ? [new DataNodeBase({data:log.data})] : undefined })
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

    export class State extends ImmutableTree.State<NodeBase>{

        public readonly tStart: number
        public readonly tEnd: number
        public readonly context: Context
        public readonly rootCtx: Context

        constructor({ context, expandedNodes, selectedNode }:
            {   
                context : Context, 
                expandedNodes: Array<string>,
                selectedNode?: string
            }){
            super({
                rootNode: nodeFactory(context.root()),
                expandedNodes
            })
            this.rootCtx = context.root()
            this.context = context 
            this.tStart = this.rootCtx.startTimestamp
            this.tEnd = this.rootCtx.startTimestamp + this.rootCtx.elapsed()
            selectedNode &&  this.selectedNode$.next(this.getNode(selectedNode))
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
            containerClass: 'p-4 fv-bg-background fv-text-primary',
            containerStyle: { width: "100%", height: "100%"},
            treeViewClass: 'h-100 overflow-auto',
            treeViewStyle: {}
        }
        public readonly domId: string = 'contextView-view'
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
                options: {
                    classes: { 
                        header: "d-flex align-items-baseline fv-tree-header fv-hover-bg-background-alt "
                    }
                }
            } as any)

            this.children = [
                treeView
            ]
        }
    }

    export function reportContext(context: Context, nodeId?:string){

        let state = new State({
            context,
            expandedNodes: nodeId ? nodePath(context).concat(nodeId) : nodePath(context),
            selectedNode:  nodeId//errorLog.id
        })
        let view = new View({
            state,
        })
        ModalView.popup({
            view,
            style: { 'max-height':'75vh', width:'75vw' },
            options: {displayCancel:false, displayOk: false}

        })
    }

    function headerView( state:State, node: NodeBase){
        let heightBar = '3px'
        if (node instanceof ContextNode){

            let tStart = node.context.startTimestamp - state.rootCtx.startTimestamp
            let left =  100 * tStart / (state.tEnd - state.tStart)
            let width = 100 * node.context.elapsed() / (state.tEnd - state.tStart)
            let elapsed = Math.floor(100 * node.context.elapsed()) / 100
            let classes = {
                [ContextStatus.FAILED] : "fas fa-times fv-text-error",
                [ContextStatus.SUCCESS] : "fas fa-check fv-text-success",
                [ContextStatus.RUNNING] : "fas fa-cog fa-spin",

            }
            return { 
                class:'w-100 pb-2',
                children:[
                    {   class: "d-flex align-items-center",
                        children: [
                            {
                                tag: 'i',
                                class: classes[node.context.status()]
                            },                            
                            {
                                innerText: node.context.title +`  - ${elapsed} ms`, 
                                class: 'fv-pointer px-2',
                                style: {'font-family': 'fantasy'}
                        }]
                    },
                    {   class: 'fv-bg-success',
                        style: {
                            top: '0px',
                            height:heightBar,
                            width: width+'%',
                            position:'absolute',
                            left: left+'%'
                        }
                    }
                ]
            }
        }
        if (node instanceof LogNodeBase){

            let tStart = node.log.timestamp - state.rootCtx.startTimestamp
            let left =  100 * tStart / (state.tEnd - state.tStart)

            let classes = 'fv-text-primary fas fa-info'
            
            if(node instanceof LogNodeError){
                classes = 'fv-text-error fas fa-times'
            }
            if(node instanceof LogNodeWarning){
                classes = 'fv-text-focus fas fa-exclamation'
            }
            return { 
                class:'pb-1 fv-pointer w-100',
                children:[
                    {
                        class: 'd-flex align-items-center',
                        children:[
                            { class: classes},
                            { innerText: node.log.text, class:'px-2'},
                        ] 
                    },
                    {   class: 'fv-bg-success rounded',
                        style: {
                            height:heightBar,
                            width: heightBar,
                            top: '0px',
                            position:'absolute',
                            left: `calc( ${left}% - 5px)`
                        }
                    }
                ]
            }
        }
        if (node instanceof DataNodeBase){

            let views = Journal.getViews(node.data).map( view => view.view)
            
            if(views.length>0)
                return {
                    class: 'd-flex flex-grow-1',
                    style:{'white-space': 'nowrap', "min-width":'0px'},
                    children: 
                        views
                }

            let dataState = new DataTreeView.State({
                title: "",
                data: node.data,
                expandedNodes:['_0']
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