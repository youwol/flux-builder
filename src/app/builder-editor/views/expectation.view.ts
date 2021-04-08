import { AllOf, AnyOf, Contract, ExpectationStatus, Of, OptionalsOf } from "@youwol/flux-core";
import { VirtualDOM } from "@youwol/flux-view";
import { ImmutableTree } from "@youwol/fv-tree";
import { BehaviorSubject } from "rxjs";


export namespace ExpectationView{


    export class ExpectationNode extends ImmutableTree.Node{

        public readonly name: string
        public readonly isRealized: boolean

        constructor({name,children, isRealized}){
            super({id: name,children})
            this.name = name
            this.isRealized = isRealized
        }
    }


    export class AnyOfNode extends ExpectationNode{
        constructor({name,children, isRealized}){
            super({name, children, isRealized})
        }
    }


    export class AllOfNode extends ExpectationNode{
        constructor({name,children, isRealized}){
            super({name, children, isRealized})
        }
    }


    export class OfNode extends ExpectationNode{
        constructor({name,children, isRealized}){
            super({name, children, isRealized})
        }
    }


    export function parseReport( rootStatus : ExpectationStatus<any>){

        let parseNode = (status : ExpectationStatus<any>) => {

            let nodeChildren =  status.children && status.children.length > 0 
                ? status.children.map( node => parseNode(node))
                : undefined

            if(status.expectation instanceof Contract)
                return new ExpectationNode({name: status.expectation.description, children: nodeChildren, 
                    isRealized: status.succeeded})

            if(status.expectation instanceof AnyOf)
                return new AnyOfNode({name:  status.expectation.description, children: nodeChildren, 
                    isRealized: status.succeeded})

            if(status.expectation instanceof AllOf)
                return new AllOfNode({name: status.expectation.description, children: nodeChildren,
                    isRealized: status.succeeded})

            if(status.expectation instanceof Of )
                return new OfNode({name:  status.expectation.description, children: nodeChildren, 
                    isRealized: status.succeeded})
            
            if(status.expectation instanceof OptionalsOf )
                return new AnyOfNode({name:  status.expectation.description, children: nodeChildren, 
                    isRealized: status.succeeded})

            return new ExpectationNode({
                name: status.expectation.description, 
                children: nodeChildren, 
                isRealized: status.succeeded ? status.succeeded: undefined})
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

            this.treeStateRequired = new ImmutableTree.State({
                rootNode: treeNode.children[0],
                expandedNodes:expandedNodes$
            })
            this.treeStateOptionals = new ImmutableTree.State({
                rootNode: treeNode.children[1],
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

    function headerView(_: ImmutableTree.State<ExpectationNode>, node: ExpectationNode) {

        let classes = ""
        if(node.isRealized)
            classes = "fv-text-success"
        if(node.isRealized==false)
            classes = "fv-text-error"
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
                    { innerText: node.name, class:'fv-text-primary'},
                    { class :classes + " "+icon},
                    { tag:'i', class:'fv-text-primary', innerText: "All of the following:"}]
            }
        }

        if(node instanceof AnyOfNode){
            return {
                class: 'd-flex align-items-center',
                children:[
                    { innerText: node.name, class:'fv-text-primary'},
                    { class :classes + " "+icon},
                    { tag:'i', class:'fv-text-primary', innerText: "Any of the following:"}]
            }
        }

        if(node instanceof OfNode){
            return {
                class:'d-flex flex-align-items-center ',
                children:[
                    { innerText: node.name, class:classes },
                    { class: icon}
                ]
            }
        }

        return {
            class :classes,
            innerText: node.name
        }
    }
}