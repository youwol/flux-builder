import { ModuleFlow, Journal } from "@youwol/flux-core";
import { child$, VirtualDOM } from "@youwol/flux-view";
import { Select } from "@youwol/fv-input";
import { BehaviorSubject } from "rxjs";
import { map } from "rxjs/operators";
import { ContextView } from "./context.view";
import { ModalView } from "./modal.view";


export namespace JournalsView{

    export class State{

        public readonly module: ModuleFlow
        
        constructor({ module}: {
            module: ModuleFlow
        }){
            this.module = module
        }
    }

    type TOptions = {
        containerClass?: string,
        containerStyle?: {[key:string]: string},
    }

    export class View implements VirtualDOM{

        static defaultOptions : TOptions = {
            containerClass: 'd-flex flex-column p-3',
            containerStyle: { 'min-height':'0px'},
        }

        public readonly state: State
        public readonly class: string
        public readonly style: {[key: string]: string}
        public readonly children: Array<VirtualDOM>

        connectedCallback : (elem) => void

        constructor({
            state,
            ...rest
        }:
        {
            state: State,
        }) {
            Object.assign(this, rest)
            this.state = state
            this.class = this.class || View.defaultOptions.containerClass
            this.style = this.style || View.defaultOptions.containerStyle

            if( this.state.module.journals.length == 0) {
                this.children = [
                    this.noJournalsAvailableView()
                ]
                return 
            }
            if( this.state.module.journals.length == 1 ){
                this.children = [
                    this.journalView(this.state.module.journals[0])
                ]
                return 
            }

            let journalSelected$ = new BehaviorSubject<string>(this.state.module.journals[0].title)
            this.children = [
                this.selectJournalView(journalSelected$),
                child$(
                    journalSelected$.pipe(
                        map( title => this.state.module.journals.find( journal => journal.title == title))
                    ),
                    (journal: Journal ) => this.journalView(journal)
                )
            ]

        }


        noJournalsAvailableView() : VirtualDOM {
            return {
                innerText: 'The module does not contains journals yet, it is likely that it did not run already.'
            }
        }

        selectJournalView(journalSelected$ : BehaviorSubject<string>) : VirtualDOM {

            let items = this.state.module.journals.map( (journal: Journal) => {
                return new Select.ItemData(journal.title, journal.title)
            })
            let state = new Select.State(items, journalSelected$)
            return {
                class:'d-flex align-items-center py-2',
                children: [
                    { innerText: 'Available reports:', class:'px-2'},
                    new Select.View({state}) 
                ] 
            }
        }


        journalView( journal: Journal ) : VirtualDOM {

            let state = new ContextView.State(
                {   context: journal.entryPoint, 
                    expandedNodes: [journal.entryPoint.id]
                }
            )
            return {
                class:"h-100 d-flex flex-column",
                children: [
                    {   class: 'd-flex align-items-center justify-content-center',
                        children: [
                            {
                                tag:'i',
                                class: 'fas fa-newspaper fa-2x px-3'
                            },
                            {
                                class:'text-center py-2',
                                style: {'font-family': 'fantasy', 'font-size': 'larger'},
                                innerText: journal.title 
                            } 
                        ]
                    },
                    new ContextView.View({
                        state,
                        options:{
                            containerClass:'p-4 flex-grow-1 overflow-auto'
                        }})
                ]
            }
        }
    }

    export function popupModal({
        module
    }: {
        module: ModuleFlow
    }){

        let state = new State({module})
        let view = new View({state})
        
        ModalView.popup({
            view,
            style: { 'max-height':'75vh', width:'75vw' },
            options: {displayCancel:false, displayOk: false}
        }).subscribe( () => {
        })
    }
}