import { child$, VirtualDOM } from "@youwol/flux-view";
import { BehaviorSubject, from } from "rxjs";
import { mergeMap } from "rxjs/operators";



export namespace CodeEditorView{


    export class State{
        public readonly codeMirror$ = fetchCodeMirror$()
        public readonly content$ : BehaviorSubject<string>

        constructor({
                content$ 
            }:
            {
                content$: BehaviorSubject<string>
            }
        ){
            this.content$ = content$
        }
    }


    type TOptions = {
        containerClass?: string,
        containerStyle?: {[key:string]: string},
    }

    export class View implements VirtualDOM{

        static defaultOptions  = {
            containerClass: 'h-100 w-100',
            containerStyle: {},
        }
        public readonly state: State
        public readonly class: string
        public readonly style: {[key:string]: string}
        public readonly children: Array<VirtualDOM>

        constructor({
            state,
            options,
            ...rest
        }: {
            state: State,
            options?: TOptions
        }){
            Object.assign(this, rest)
            let styling : TOptions = {...View.defaultOptions, ...(options ? options : {}) }
            this.state = state
            this.class = styling.containerClass
            this.style = styling.containerStyle

            this.children = [
                child$( 
                    state.codeMirror$,
                    () => {
                        return {
                            id: 'code-mirror-editor',
                            class: 'w-100 h-100',
                            connectedCallback: (elem) => {
                                let editor = window['CodeMirror'](elem, {
                                    value: state.content$.getValue(),
                                    mode: 'javascript',
                                    lineNumbers: true,
                                    theme:'blackboard'
                                })
                                editor.on("changes" , () => {
                                    state.content$.next(editor.getValue())
                                })
                            }
                        }
                    }
                )
            ]
        }
    }

    function fetchCodeMirror$(){
        let cdn = window['@youwol/cdn-client']
        
        return from(cdn.fetchBundles( {  codemirror: { version: '5.52.0' } },  window)
        ).pipe(
            mergeMap( () =>{
                let promise = cdn.fetchJavascriptAddOn(
                    ["codemirror#5.52.0~mode/javascript.min.js"], 
                    window
                    )
                return from(promise)
            })
        )
    }
}