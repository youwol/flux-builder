import { ConfigurationStatus, ConsistentConfiguration, ExpectationStatus, IExpectation, mergeConfiguration, ModuleFlux, 
    InconsistentConfiguration, 
    Context} from "@youwol/flux-core";
import { VirtualDOM } from "@youwol/flux-view";
import { Tabs } from "@youwol/fv-tabs";
import { BehaviorSubject } from "rxjs";
import { ConfigurationStatusView } from "./configuration-status.view";
import { ExpectationView } from "./expectation.view";




export namespace InputStatusView{


    class  DataTab extends Tabs.TabData{
        constructor(){super('data', 'data')}
    }
    class ConfigTab extends Tabs.TabData{
        constructor(){super('configuration', 'configuration')}
    }


    export class State{

        public readonly configStatus: ConfigurationStatus<any>
        public readonly dataStatus: ExpectationStatus<unknown>
        
        public readonly selectedTabId$ : BehaviorSubject<string>
        public readonly tabState : Tabs.State

        constructor({
            mdle,
            adaptedInput,
            contract,
            selectedTabId$
        }:{
            mdle: ModuleFlux,
            contract: IExpectation<unknown>,
            adaptedInput : {data, configuration, context},
            selectedTabId$?: BehaviorSubject<string>
        }){

            this.selectedTabId$ = selectedTabId$ ||new BehaviorSubject<string>("data")
            this.tabState = new Tabs.State([new DataTab(), new ConfigTab()],selectedTabId$)

            this.configStatus = mergeConfiguration( mdle.configuration.data, adaptedInput.configuration)
            let context = new Context("",{})
            this.dataStatus = contract.resolve(adaptedInput.data, context)
        }
    }


    type TOptions = {
        containerClass?: string,
        containerStyle?: {[key:string]: string}
    }


    export class View implements VirtualDOM{

        static defaultOptions  = {
            containerClass: 'h-100 w-100',
            containerStyle: {}
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
        }){
            Object.assign(this, rest)

            this.options = {...View.defaultOptions, ...(options ? options : {}) }
            this.state = state
            this.class = this.options.containerClass
            this.style = this.options.containerStyle 

            
            let expandedNodesExpectation$ =  new BehaviorSubject<Array<string>>(['optional', 'required'])
                    
            let tabView = new Tabs.View({
                state: this.state.tabState,
                contentView: (state, data) => { 
                    if(data instanceof DataTab){
        
                        let state = new ExpectationView.State({
                            status: this.state.dataStatus,
                            expandedNodes$: expandedNodesExpectation$
                        })
                        return new ExpectationView.View({state})
                    }
        
                    if(data instanceof ConfigTab){
        
                        let state = new ConfigurationStatusView.State({
                            status: this.state.configStatus
                        })
                        return new ConfigurationStatusView.View({state})
                    }
                },
                headerView: (state, data) => { 
        
                    if(data instanceof DataTab)
                        {return dataHeaderView(this.state.dataStatus)}
        
                    if(data instanceof ConfigTab)
                        {return configurationHeaderView(this.state.configStatus)}
        
                    return {innerText:data.name, class:"px-2"}
                },
                class:'h-100 d-flex flex-column', style:{'min-height':'0px'},
                options:{
                    containerStyle:{'min-height':'0px'},
                    containerClass: 'p-2 border flex-grow-1 overflow-auto'
                }
            }as any)

            this.children= [tabView]
        }
    }

    function dataHeaderView(status: ExpectationStatus<any>){
    
        let classes = 'fas fa-check fv-text-success px-1'
        if(!status)
            {classes = 'fas fa-question px-1'}
        else if(!status.succeeded)  
            {classes = 'fas fa-times fv-text-error px-1'}
        return {
            class:'d-flex align-items-center px-2',
            children:[
                { class: classes},
                { innerText: 'data'}
            ]
        }
    }

    function configurationHeaderView(status: ConfigurationStatus<unknown>){

        let icon = {}
        if (status instanceof InconsistentConfiguration)
            {icon = { class:'fas fa-times fv-text-error px-1'}}
        if (status instanceof ConsistentConfiguration &&  status.intrus.length>0)
            {icon = { class:'fas fa-exclamation fv-text-danger px-1'}}
        if (status instanceof ConsistentConfiguration &&  status.intrus.length==0)
            {icon = { class:'fas fa-check fv-text-success px-1'}}  
        
        return {
            class:'d-flex align-items-center px-2',
            children:[
                icon,
                {innerText: 'configuration'}
            ]
        }
    }
}