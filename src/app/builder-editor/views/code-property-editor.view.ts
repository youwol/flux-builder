import { ModuleFlow } from "@youwol/flux-core"
import { render, VirtualDOM } from "@youwol/flux-view"
import { Button } from "@youwol/fv-button"
import { Modal } from "@youwol/fv-group"
import { BehaviorSubject } from "rxjs"
import { CodeEditorView } from "./code-editor.view"


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
            let mdle = this.state.mdle
            return {}
            /*
            let lastReport = Reporters.reporters['flux-debug'].reports[mdle.moduleId]
            if(!lastReport)
                return {
                    class:'d-flex flex-column fv-text-primary ',
                    style:{'font-family': 'monospace'},
                    children:[
                        {
                            tag:'p',
                            innerText: 'No data available: the module has not played any scenario yet. Having data available may help to write your code.'
                        },
                        {
                            tag:'p',
                            innerText: 'Getting some data is usually as easy as connecting the input(s) of your module.'
                        }
                    ]
                }
            
            let children = Object.values(lastReport.slotsReport).map( ({report}: {report:Report}) => {
                
                let rootNode = nodeFactory(report.slotId, {...(report.adaptedInput as Object), ...{configuration:report.mergedConfiguration}}, 0)
        
                let treeState = new DataTreeState({
                    rootNode,
                    expandedNodes:[rootNode.id]
                } as any)
                let treeView = new ImmutableTree.View({
                    state: treeState,
                    headerView: dataNodeHeaderView
                })
                return treeView
            })
            return {
                class:'d-flex flex-column fv-text-primary cm-s-blackboard overflow-auto', 
                style:{'font-family': 'monospace', 'max-width': '50%'},
                children: [
                    {
                        tag:'p',
                        innerText: 'Below is the input data of the last scenario played by the module.'
                    },
                    ...children
                ]
            }*/
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

        let okBttn = new Button.View({
            state: new Button.State(),
            contentView: () => ({ innerText: 'Update'}),
            class: "fv-btn fv-btn-primary fv-bg-focus mr-2"
        } as any)

        let cancelBttn = Button.simpleTextButton('Cancel')
        
        let contentState = new State({mdle, initialCode})
/*
{
                return {
                    class:'border rounded fv-text-primary fv-bg-background d-flex flex-column',
                    style: { height:'50vh', width:'90vw', 'max-width':'1500px'},
                    children:[
                        new View({
                            state: contentState, 
                            options:{
                                containerClass: 'p-3 d-flex flex-grow-1 w-100',
                                containerStyle: {'min-height':'0px'}
                            }
                        }),
                        {
                            class:'d-flex p-2',
                            children:[
                                okBttn,
                                cancelBttn
                            ]
                        }
                    ]
                }
            }
            */
        let modalState = new Modal.State()
        let view = new Modal.View({
            state: modalState,
            contentView: () => ({
                class:'border rounded fv-text-primary fv-bg-background d-flex flex-column',
                style: { height:'50vh', width:'90vw', 'max-width':'1500px'},
                children:[
                    new View({
                        state: contentState, 
                        options:{
                            containerClass: 'p-2 d-flex flex-grow-1 w-100',
                            containerStyle: {'min-height':'0px'}
                        }
                    }),
                    {
                        class:'d-flex p-2',
                        children:[
                            okBttn,
                            cancelBttn
                        ]
                    }
                ]
            }) 
        })

        let modalDiv = render(view)
        okBttn.state.click$.subscribe( () => modalState.ok$.next())
        cancelBttn.state.click$.subscribe( () => modalState.cancel$.next())

        document.querySelector("body").appendChild(modalDiv)
        modalState.cancel$.subscribe( () => modalDiv.remove() )

        modalState.ok$.subscribe( () => {
            onUpdate( contentState.codeEditorState.content$.getValue())
            modalDiv.remove()
        })
    }
}