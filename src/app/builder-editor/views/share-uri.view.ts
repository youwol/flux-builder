
import { VirtualDOM, attr$ } from '@youwol/flux-view'
import { Button } from '@youwol/fv-button'
import { Select } from '@youwol/fv-input'
import { combineLatest, from, Observable } from 'rxjs'
import { mergeMap } from 'rxjs/operators'
import { AppStore } from '../builder-state'
import { ModalView } from './modal.view'


export namespace ShareUriView{
    
    export class State{

        selectState : Select.State
        sourceURI$ : Observable<[string,string]>

        constructor({appStore}:{
            appStore: AppStore
        }) {
            let selectItems = [
                new Select.ItemData('youwol-url','YouWol Platform URL'),
                new Select.ItemData('relative-url','Relative URL')
            ]
            if( location.hostname=='localhost')
                {selectItems.push(new Select.ItemData('localhost-url','Localhost URL'))}

            this.selectState = new Select.State(selectItems,'youwol-url')

            this.sourceURI$ = combineLatest([appStore.projectURI$(), this.selectState.selectionId$])
        }

        toUrl( uri: string, mode: string){

            if(mode=='relative-url')
              {return `${uri}`}
            if(mode=='localhost-url')
              {return `${location.hostname}:${location.port}${uri}`}
            return `https://platform.youwol.com${uri}`
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

            let copyLinkBttn = new Button.View({
                state: new Button.State(),
                contentView: () => ({ innerText: '' }),
                class: "fv-btn fv-btn-primary fv-bg-focus fas fa-copy ml-2"
              } as any)

            this.connectedCallback = (elem) => {
                elem.subscriptions.push(
                    copyLinkBttn.state.click$.pipe(
                        mergeMap( () => 
                            state.sourceURI$ ),
                        mergeMap( ([uri, mode]) => 
                            from(navigator.clipboard.writeText(state.toUrl(uri, mode)))) 
                    ).subscribe( () => {
                        console.log("Copied:::!!!")
                        //onUpdate( state.codeEditorState.content$.getValue())
                    }) 
                )
            }
            this.children = [
                {
                    innerText: 'The following url can be used to share your application:'
                },
                new Select.View({state: state.selectState}),
                {
                    class: 'd-flex align-items-center',
                    children: [
                    {
                        style: { 'text-overflow': 'ellipsis', 'white-space': 'nowrap', 'overflow': 'hidden', 'font-family': 'monospace' },
                        innerText: attr$(
                        state.sourceURI$,
                        ([uri, mode]) => state.toUrl(uri, mode)
                        )
                    },
                    copyLinkBttn
                    ]
                },
                { 
                    class:'d-flex align-items-center fv-bg-background-alt rounded my-3',
                    children:[
                    {
                        class:'fas fa-exclamation fv-text-focus px-2'
                    },
                    {
                        innerText: "This feature is a work in progress, it is expected to work with 'relatively' small application for now. "+
                        "Also, the consumer of this link will need to have access to all packages/modules/resources included in your app."
                    }
                    ]
                }
            ]
        }
    }

    export function popupModal(appStore: AppStore) {

        let state = new State({appStore})
        let view = new View({state})
        
        ModalView.popup({
            view,
            style: {  width:'75vw', 'max-width':'1000px' },
            options: { displayOk: false, displayCancel: false }
        })
    }
}