import { AllOf, AnyOf, Contract, ExpectationStatus, Of, OptionalsOf } from "@youwol/flux-core"
import { ImmutableTree } from '@youwol/fv-tree'


export class ReportNode extends ImmutableTree.Node{

    public readonly name: string
    public readonly isRealized: boolean

    constructor({name,children, isRealized}){
        super({id: name,children})
        this.name = name
        this.isRealized = isRealized
    }
}
export class AnyOfNode extends ReportNode{
    constructor({name,children, isRealized}){
        super({name, children, isRealized})
    }
}
export class AllOfNode extends ReportNode{
    constructor({name,children, isRealized}){
        super({name, children, isRealized})
    }
}
export class OfNode extends ReportNode{
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
            return new ReportNode({name: status.expectation.description, children: nodeChildren, 
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

        return new ReportNode({
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

