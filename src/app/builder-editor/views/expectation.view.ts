import { AllOf, AnyOf, Contract, ExpectationStatus, Of, OptionalsOf, uuidv4 } from "@youwol/flux-core";
import { VirtualDOM } from "@youwol/flux-view";
import { ImmutableTree } from "@youwol/fv-tree";
import { BehaviorSubject } from "rxjs";
import { DataTreeView } from "./data-tree.view";


export namespace ExpectationView{


    export class ExpectationNode extends ImmutableTree.Node{

        public readonly name: string
        public readonly isRealized: boolean
        public readonly evaluatedFrom: unknown

        constructor({name,children, isRealized, evaluatedFrom}){
            super({id: uuidv4(),children})
            this.name = name
            this.isRealized = isRealized
            this.evaluatedFrom = evaluatedFrom
        }
    }


    export class AnyOfNode extends ExpectationNode{
        constructor({name,children, isRealized, evaluatedFrom}){
            super({name, children, isRealized, evaluatedFrom})
        }
    }


    export class AllOfNode extends ExpectationNode{
        constructor({name,children, isRealized, evaluatedFrom}){
            super({name, children, isRealized, evaluatedFrom})
        }
    }


    export class OfNode extends ExpectationNode{
        constructor({name,children, isRealized, evaluatedFrom}){
            super({name, children, isRealized, evaluatedFrom})
        }
    }


    export function parseReport( rootStatus : ExpectationStatus<any>){

        let parseNode = (status : ExpectationStatus<any>) => {

            let nodeChildren =  status.children && status.children.length > 0 
                ? status.children.map( node => parseNode(node))
                : undefined
            let dataNode = new DataTreeView.ObjectNode({
                id: uuidv4(),
                name:'evaluated-with', 
                data:status.fromValue, 
                nestedIndex:0
            })
            if( nodeChildren && status.succeeded != undefined && !(status.expectation instanceof Contract) )
                nodeChildren = [dataNode, ...nodeChildren ]
            if(status.expectation instanceof Contract)
                return new ExpectationNode({name: status.expectation.description, children: nodeChildren, 
                    isRealized: status.succeeded, evaluatedFrom: status.fromValue})

            if(status.expectation instanceof AnyOf)
                return new AnyOfNode({name:  status.expectation.description, children: nodeChildren, 
                    isRealized: status.succeeded, evaluatedFrom: status.fromValue})

            if(status.expectation instanceof AllOf)
                return new AllOfNode({name: status.expectation.description, children: nodeChildren,
                    isRealized: status.succeeded, evaluatedFrom: status.fromValue})

            if(status.expectation instanceof Of )
                return new OfNode({name:  status.expectation.description, children: nodeChildren, 
                    isRealized: status.succeeded, evaluatedFrom: status.fromValue})
            
            if(status.expectation instanceof OptionalsOf )
                return new AnyOfNode({name:  status.expectation.description, children: nodeChildren, 
                    isRealized: status.succeeded, evaluatedFrom: status.fromValue})
                    
            return new ExpectationNode({
                name: status.expectation.description, 
                children: nodeChildren, 
                isRealized: status.succeeded != undefined ? status.succeeded: undefined,
                evaluatedFrom: status.fromValue})
        }

        return parseNode(rootStatus)
    }


    export class ExecutionError{
        constructor(public readonly message:string, public readonly row: number, public readonly col: number){}
    }


    export function parseError(stack:string): ExecutionError{

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



    export class State{

        public readonly status: ExpectationStatus<any>
        public readonly treeStateRequired :  ImmutableTree.State<ExpectationNode>
        public readonly treeStateOptionals :  ImmutableTree.State<ExpectationNode>
        constructor( {
            status,
            expandedNodes$
        }:{
            status: ExpectationStatus<any>,
            expandedNodes$?: BehaviorSubject<Array<string>>
        }){
            
            this.status = status

            let treeNode = parseReport(this.status)
            let requiredRootNode = treeNode.children && treeNode.children.length > 0 
                ? treeNode.children[0] 
                : new ExpectationNode({name:'No required conditions defined', children:undefined, isRealized:true, evaluatedFrom:undefined})
                
            this.treeStateRequired = new ImmutableTree.State({
                rootNode: requiredRootNode,
                expandedNodes:expandedNodes$
            })

            let optionalRootNode = treeNode.children && treeNode.children.length > 1 
                ? treeNode.children[1] 
                : new ExpectationNode({name:'No optional conditions defined', children:undefined, isRealized:true, evaluatedFrom:undefined})

            this.treeStateOptionals = new ImmutableTree.State({
                rootNode: optionalRootNode,
                expandedNodes:expandedNodes$
            })
        }
    }

    type TOptions = {
        containerClass?: string,
        containerStyle?: {[key:string]: string},
    }

    export class View implements VirtualDOM {

        static defaultOptions  = {
            containerClass: 'd-flex flex-column',
            containerStyle: { 'min-height':'0px'},
        }

        public readonly state: State
        public readonly class: string
        public readonly style: {[key: string]: string}
        public readonly children: Array<VirtualDOM>

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
            let styling : TOptions = {...View.defaultOptions, ...(options ? options : {}) }
            this.state = state
            this.class = styling.containerClass
            this.style = styling.containerStyle

            this.children = [
                {
                    class:'d-flex align-items-center',
                    children:[
                        {
                            class: this.state.status.succeeded ? 'fas fa-check fv-text-success' : 'fas fa-times fv-text-error',
                            style:{'min-width':'25px'}
                        },
                        {   class: 'px-2', innerText: this.state.status.expectation.description }
                    ]                
                },
                {
                    class:'pl-2 flex-grow-1 overflow-auto ', style:{'min-height':'0px'},
                    children:[
                        {
                            class:'pl-2',
                            children:[
                                new ImmutableTree.View({
                                    state:this.state.treeStateRequired, 
                                    headerView
                                }),                
                                new ImmutableTree.View({
                                    state:this.state.treeStateOptionals, 
                                    headerView
                                }),
                            ]
                        }
                    ]
                }
            ]
        }
    }
    export function journalWidget(data: ExpectationStatus<unknown>) : VirtualDOM {

        let dataState = new DataTreeView.State({
            title: "incoming data",
            data: data.fromValue,
            expandedNodes: ["incoming data_0"]
        })

        let expectationState = new ExpectationView.State({
            status: data
        })
        
        return {
            children:[
                {
                    class: 'd-flex justify-content-around w-100',
                    style:{'white-space': 'nowrap'},
                    children: [
                        new DataTreeView.View({state: dataState}),
                        {class:'px-4'},
                        new ExpectationView.View({ state: expectationState })
                    ]
                }
            ]
        }
    }


    function headerView(_: ImmutableTree.State<ExpectationNode>, node: ExpectationNode) {

        if( node instanceof DataTreeView.DataNode){
            return DataTreeView.dataNodeHeaderView( undefined, node)
        }

        let classes = ""
        if(node.isRealized)
            classes = "fv-text-success"
        //if(node.isRealized==false)
        //    classes = "fv-text-error"
        if(node.isRealized==undefined)
            classes = "fv-text-disabled"
            
        let icon = ""
        if(node.isRealized)
            icon = "fas fa-check fv-text-success px-1"
        if(node.isRealized==false)
            icon = "fas fa-times fv-text-error px-1"

        if(node instanceof AllOfNode){
            return {
                class: 'd-flex align-items-center',
                children:[
                    { class :classes + " "+icon},
                    { innerText: node.name, class:'fv-text-primary px-2'},
                    { tag:'i', class:'fv-text-primary', innerText: "All of the following:"}]
            }
        }

        if(node instanceof AnyOfNode){
            return {
                class: 'd-flex align-items-center',
                children:[
                    { class :classes + " "+icon},
                    { innerText: node.name, class:'fv-text-primary px-2'},
                    { tag:'i', class:'fv-text-primary', innerText: "Any of the following:"}]
            }
        }

        if(node instanceof OfNode){
            return {
                class:'d-flex flex-align-items-center ',
                children:[
                    { class: icon},
                    { innerText: node.name, class:classes }
                ]
            }
        }

        return {
            class:'d-flex flex-align-items-center ',
            children:[
                { class: icon},
                { innerText: node.name, class:classes }
            ]
        }
    }
}