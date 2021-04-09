import { ModuleFlow } from "@youwol/flux-core"
import { render, VirtualDOM } from "@youwol/flux-view"
import { Button } from "@youwol/fv-button"
import { Modal } from "@youwol/fv-group"
import { BehaviorSubject } from "rxjs"
import { CodeEditorView } from "./code-editor.view"
import { ModalView } from "./modal.view"


export namespace CodePropertyEditorView{


    export class State{

        public readonly mdle: ModuleFlow
        public readonly codeEditorState: CodeEditorView.State

        constructor({
            mdle,
            initialCode
        } : {
            mdle: ModuleFlow,
            initialCode: string
        }){
            this.mdle = mdle 
            let content$ = new BehaviorSubject<string>(initialCode)
            this.codeEditorState = new CodeEditorView.State({content$})
        }
    }


    type TOptions = {
        containerClass?: string,
        containerStyle?: {[key:string]: string}
    }

    export class View implements VirtualDOM {

        static defaultOptions  = {
            containerClass: 'fv-bg-background p-3 fv-text-primary rounded d-flex ',
            containerStyle: { height:'50vh', width:'90vw', 'max-width':'1500px'}
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

            this.children = [
                this.moduleContextView(),
                { 
                    class:'d-flex flex-column h-100 w-100 mx-2',
                    children:[
                        new CodeEditorView.View({state: this.state.codeEditorState})
                    ]
                }
            ]


        }

        moduleContextView(){
            return {}
        }

    }


    export function popupModal({
        mdle, 
        initialCode, 
        onUpdate
    }: {
        mdle: ModuleFlow, 
        initialCode: string, 
        onUpdate: (string) => void
    }){

        let state = new State({mdle, initialCode})
        let view = new View({
            state: state, 
            options:{
                containerClass: 'p-2 d-flex flex-grow-1 w-100',
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