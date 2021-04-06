import {ImmutableTree} from '@youwol/fv-tree'
import { Observable, of } from 'rxjs'
import { map } from 'rxjs/operators'

export class DataTreeState extends ImmutableTree.State<DataNode>{

    public readonly stringLengthLimit

    constructor({rootNode, stringLengthLimit, ...rest}: {rootNode:DataNode,stringLengthLimit?: number } ){
        super({rootNode,...rest})
        this.stringLengthLimit = stringLengthLimit | 20
    }
}

export function nodeFactory(
    name: string, 
    data: string | number | boolean | Array<any> | Object | undefined,
    nestedIndex: number){

    if(data==undefined)
        return new UndefinedNode({name, nestedIndex})

    if(typeof data == 'string')
        return new StringNode({name, data, nestedIndex})
    
    if(typeof data == 'number')
        return new NumberNode({name, data, nestedIndex})
    
    if(typeof data == 'boolean')
        return new BoolNode({name, data, nestedIndex})

    if(typeof data == 'function')
        return new FunctionNode({name, data, nestedIndex})

    if( Array.isArray(data) )
        return new ArrayNode({name, data, nestedIndex})
       
    if(typeof data == 'object')
        return new ObjectNode({name, data, nestedIndex})

    return new UnknownNode({name, nestedIndex})           
}

export class DataNode extends ImmutableTree.Node{

    name: string
    nestedIndex: number
    classes: string

    constructor(
        {name, children, classes, nestedIndex} :
        {name: string, children?: Observable<Array<ImmutableTree.Node>> , classes:string, nestedIndex:number}){
        super( {id:`${name}_${nestedIndex}`, children}) // `${Math.floor(Math.random()*1e6)}`
        this.name = name
        this.classes = classes
        this.nestedIndex = nestedIndex
    }
}

class UndefinedNode extends DataNode{

    constructor({name, nestedIndex} : {name: string, nestedIndex:number}){
        super( {name, classes:"fv-text-disabled", nestedIndex} )
    }
}

class UnknownNode extends DataNode{

    constructor({name, nestedIndex} : {name: string, nestedIndex:number}){
        super( {name, classes:"", nestedIndex} )
    }
}

class ValueNode<T> extends DataNode{ 

    data: T
    classes: string

    constructor({name, data, classes, nestedIndex} : {name: string, data: T, classes:string, nestedIndex:number}){
        super( {name, classes, nestedIndex} )
        this.data = data
    }
}

class NumberNode extends ValueNode<number>{
    constructor({name, data, nestedIndex} : {name: string, data: number, nestedIndex:number}){
        super( {name, data, classes:"cm-number", nestedIndex} )
    }
}

class StringNode  extends ValueNode<string>{
    constructor({name, data, nestedIndex} : {name: string, data: string, nestedIndex:number}){
        super( {name, data, classes:"cm-string", nestedIndex} )
    }
}

class BoolNode extends ValueNode<boolean>{

    constructor({name, data, nestedIndex} : {name: string, data: boolean, nestedIndex: number}){
        super( {name, data, classes:"cm-atom", nestedIndex} )
    }
}


class FunctionNode extends DataNode{

    data: any
    constructor({name, data, nestedIndex} : {name: string, data: any, nestedIndex}){
        super( {name, classes:"cm-def", nestedIndex} )
        this.data = data
    }
}

class ObjectNode extends DataNode{

    getChildrenNodes(object){

        let attributes =  Object.entries(object).map( ([k,v]) => nodeFactory(k,v, this.nestedIndex+1))
        let functions = Object.entries(object.__proto__).map( ([k,v]) => new FunctionNode({name:k,data:v, nestedIndex: this.nestedIndex+1}))
        return [...attributes, ...functions]
    }

    data: Object
    constructor({name, data, nestedIndex} : {name: string, data: Object, nestedIndex:number}){
        super( { 
            name, 
            children: of(data).pipe( map( (data)=> this.getChildrenNodes(data) )),
            classes: "",
            nestedIndex
        })
        this.data = data
    }
}

class ArrayNode extends DataNode{

    data: Array<any>
    constructor({name, data, nestedIndex} : {name: string, data: Array<any>, nestedIndex:number}){
        super( {
            name, 
            children: of(data).pipe( map( (data)=> Object.entries(data).map( ([k,v]) => nodeFactory(`${k}`,v, nestedIndex+1)))),
            classes:"",
            nestedIndex
        } )
        this.data = data
    }
}

export function dataNodeHeaderView(state: DataTreeState, node:DataNode){

    if(node instanceof UnknownNode)
        return {
            class:'d-flex fv-text-disabled flex-wrap',
            innerText: node.name
        }
    let content = ""
    if(node instanceof ValueNode){
        content = String(node.data)
        if(content.length>state.stringLengthLimit)
            content = content.substr(0,state.stringLengthLimit) + "..."
        if(typeof node.data=='string')
            content= "'"+content+"'"
    }

    if(node instanceof UndefinedNode)
        content = 'undefined'


    if(node instanceof FunctionNode){
        content = `f(${node.data.length} arg(s))`
    }

    if(node instanceof ObjectNode)
        content = '{...}'
    
    if(node instanceof ArrayNode)
        content = '[...]'

    return {
        class:'d-flex fv-pointer',
        children:[
            {
                innerText: node.name
            },
            {   
                class:'px-2 '+node.classes,
                innerHTML: `<i>${content}</i>`
            }
        ]
    }  
}