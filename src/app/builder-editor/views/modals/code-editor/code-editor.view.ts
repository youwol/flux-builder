import { Connection, ModuleFlow} from '@youwol/flux-core'
import { VirtualDOM, render, child$ } from '@youwol/flux-view'
import { Modal } from '@youwol/fv-group'
import { BehaviorSubject, from, Observable, of } from 'rxjs'
import { mergeMap } from 'rxjs/operators'
import { Button } from '@youwol/fv-button'
import * as _ from 'lodash'
import { moduleContextView } from './module.view'
import { connectionContextView, connectionStatusView } from './connection.view'
import { AppStore } from '../../../builder-state/index'


export function codeEditorModal(
    selection: ModuleFlow | Connection, 
    initialCode: string, 
    onUpdate: (string) => void,
    appStore: AppStore
    ){

    let okBttn = new Button.View({
        state: new Button.State(),
        contentView: () => ({ innerText: 'Update'}),
        class: "fv-btn fv-btn-primary fv-bg-focus mr-2"
    } as any)
    let cancelBttn = Button.simpleTextButton('Cancel')
    
    let codeContent$ = new BehaviorSubject<string>(initialCode)

    let content = {
        class: 'fv-bg-background p-3 fv-text-primary rounded d-flex ',
        style:{ height:'50vh', width:'90vw', 'max-width':'1500px'},
        children: [
            contextView(selection, codeContent$, appStore),
            { 
                class:'d-flex flex-column h-100 w-100 mx-2',
                children:[
                    codeContentView(codeContent$),
                    bottomPanelView(selection, codeContent$, appStore),
                    {   class:'d-flex mt-2',
                        children:[
                            okBttn,
                            cancelBttn
                        ]
                    }
                ]
            }
        ]
    } as VirtualDOM

    let modalState = new Modal.State()
    let view = new Modal.View({
        state: modalState,
        contentView: () => content
    }as any)

    let modalDiv = render(view)
    okBttn.state.click$.subscribe( () => modalState.ok$.next())
    cancelBttn.state.click$.subscribe( () => modalState.cancel$.next())

    document.querySelector("body").appendChild(modalDiv)
    modalState.cancel$.subscribe( () => modalDiv.remove() )

    modalState.ok$.subscribe( () => {
        onUpdate(codeContent$.getValue())
        modalDiv.remove()
     })
}

function contextView(selection: ModuleFlow | Connection, codeContent$: Observable<string>, appStore:AppStore) {

    if(selection instanceof ModuleFlow)
        return moduleContextView(selection)

    if(selection instanceof Connection)
        return connectionContextView(selection, codeContent$, appStore)
}

function bottomPanelView(selection: ModuleFlow | Connection, codeContent$: Observable<string>, appStore:AppStore){

    if(selection instanceof ModuleFlow)
        return {}

    if(selection instanceof Connection)
        return connectionStatusView(selection, codeContent$, appStore)
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

function codeContentView( 
        content$ : BehaviorSubject<string>
        ) {
    
    let codeMirror$ = fetchCodeMirror$()

    return {
        class:'w-100 flex-grow-1 h-50', style: {height:'0px'},
        children: [
            child$( 
                codeMirror$,
                () => {
                    return {
                        id: 'code-mirror-editor',
                        class: 'w-100 h-100',
                        connectedCallback: (elem) => {
                            let editor = window['CodeMirror'](elem, {
                                value: content$.getValue(),
                                mode: 'javascript',
                                lineNumbers: true,
                                theme:'blackboard'
                            })
                            editor.on("changes" , () => {
                                content$.next(editor.getValue())
                            })
                        }
                    }
                }
            )
        ]
    }
}
/*   

    let language = { type: "javascript", ext: '.js' }
    if(fullType=="code-py"){
        language = { type: "python", ext: '.py' }
    }
    let {ownerId, tabPath} = (selection["moduleId"] !== undefined) ? 
        {ownerId: (selection as ModuleFlow).moduleId , tabPath: [(selection as ModuleFlow).configuration.title, label+language.ext ] }:
        {ownerId: (selection as Connection).connectionId , tabPath: ["connection", label+language.ext  ]}
    

        CodeEditor.mountBroadcastDrive(
            {
            ownerId : ownerId,
            drive: ({ mdle, value, label, labelDiv} :{ mdle : any, value : any, label : any, labelDiv : any}  ) => ({ 
                name:   AppStore.getInstance(undefined).project.name,
                data:  { 
                    [tabPath[0]]:{
                        [label+language.ext] : { type:language.type, content:value, name: label+language.ext  }
                    }
                },
                onFileUpdated : (file : any, ack : any ) => {
                    labelDiv.classList.add("modified")
                    labelDiv.setAttribute("value", file.content)
                    ack()
                }
            }),
            UI:{ tabs : [ { path: tabPath }] },
            mount$ :  from([{ selection, value, label, labelDiv}]),
            unmount$ : AppObservables.getInstance().unselect$
        }, '/ui/code-editor-ui' )
        */