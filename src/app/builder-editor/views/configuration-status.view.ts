import { ConfigurationStatus} from "@youwol/flux-core";
import { VirtualDOM } from "@youwol/flux-view";
import { DataTreeView } from "./data-tree.view";


export namespace ConfigurationStatusView{


    export class State{

        public readonly status :  ConfigurationStatus<unknown>
        public readonly typingErrors : DataTreeView.State | undefined
        public readonly missingFields : DataTreeView.State | undefined
        public readonly unexpectedFields : DataTreeView.State | undefined

        public readonly stringLengthLimit: number
        constructor({
            status,
            stringLengthLimit
        }: {
            status: ConfigurationStatus<unknown>,
            stringLengthLimit?: number
        }) {

            this.status = status
            this.stringLengthLimit = stringLengthLimit || 100

            // Following hack is becaus of 'instanceof' issue with 2 versions of flux-core:
            // - one is used by flux-builder
            // - one is used by the application
            // They are not necessarly the same, not sure what's the best way to fix this problem yet
            const statusAny = status as any

            if( statusAny.intrus.length == 0 && !statusAny.typeErrors && !statusAny.missings)
                {return} 

            if( statusAny.typeErrors && statusAny.typeErrors.length > 0 )
                {this.typingErrors = new DataTreeView.State({
                    title: 'typing errors',
                    data: statusAny.typeErrors
                })}
            if(  statusAny.missings && statusAny.missings.length > 0 )
                {this.missingFields = new DataTreeView.State({
                    title: 'missing fields',
                    data: statusAny.missings
                })}
            if(statusAny.intrus.length>0)
                {this.unexpectedFields = new DataTreeView.State({
                    title: 'unexpected fields',
                    data: statusAny.intrus
                })}
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
            const styling : TOptions = {...View.defaultOptions, ...(options ? options : {}) }
            this.state = state
            this.class = styling.containerClass
            this.style = styling.containerStyle

            const views = [this.state.typingErrors, this.state.missingFields, this.state.unexpectedFields]
            .filter( d => d)
            .map( state => new DataTreeView.View({ state}))

            this.children = (views.length==0) 
                ? [ { innerText: 'Your configuration is validated'} ]
                : views            
        }
    }

    export function journalWidget( data: ConfigurationStatus<unknown>) : VirtualDOM{

        const dataState = new DataTreeView.State({
            title: "merged configuration",
            data: data.result
        })
        const configurationState = new State({
            status:data
        })

        return {
            children:[
                {
                    class: 'd-flex justify-content-around w-100',
                    style:{'white-space': 'nowrap'},
                    children: [
                        new DataTreeView.View({state: dataState}),
                        {class:'px-4'},
                        new View({state:configurationState})
                    ]
                }
            ]
        }
    }

/*
    function headerView(status: ConfigurationStatus<unknown>){

        let icon = {}
        if (status instanceof UnconsistentConfiguration)
            icon = { class:'fas fa-times fv-text-error px-1'}
        if (status instanceof ConsistentConfiguration &&  status.intrus.length>0)
            icon = { class:'fas fa-exclamation fv-text-danger px-1'}
        if (status instanceof ConsistentConfiguration &&  status.intrus.length==0)
            icon = { class:'fas fa-check fv-text-success px-1'}  
        
        return {
            class:'d-flex align-items-center px-2',
            children:[
                icon,
                {innerText: 'configuration'}
            ]
        }
    }
    */
}