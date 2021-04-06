import * as _ from 'lodash'
import { Connection, InputSlot, ModuleFlow, OutputSlot } from "@youwol/flux-core"
import { dataNodeHeaderView, DataTreeState, nodeFactory } from "../../data-tree.view"
import { child$, VirtualDOM } from '@youwol/flux-view'
import { ImmutableTree } from '@youwol/fv-tree'
import { BehaviorSubject, combineLatest, Observable } from "rxjs"
import { debounceTime, map } from "rxjs/operators"
import { AppStore } from "../../../builder-state/index"
import { ExecutionError, parseError } from "../../input-validation/input-validation"
import { inputStatusView } from "../../input-validation/views"


export function connectionContextView(connection: Connection,  codeContent$: Observable<string>, appStore: AppStore){

    let mdleStart = appStore.getModule(connection.start.moduleId)
    let mdleEnd = appStore.getModule(connection.end.moduleId) 
    let sourceInput$ = mdleStart.getOutputSlot(connection.start.slotId).observable$

    let contract = mdleEnd.getInputSlot(connection.end.slotId).contract
    if(!contract)
        return contract

    return {
            class:'d-flex flex-column h-100 fv-text-primary w-50',
            style:{'font-family': 'monospace'},
            children:[
                {   class:'h-50 d-flex flex-column overflow-auto py-1',
                    children:[
                        {innerText: "Adaptor's input data", class:'text-center fv-text-focus'},
                        beforeView(sourceInput$)
                    ]
                },
                {   class:'h-50 d-flex flex-column overflow-auto py-1',
                    children:[
                        {innerText: "Module's input data", class:'text-center  fv-text-focus'},
                        moduleInputView(sourceInput$, codeContent$, mdleEnd)
                    ]
                }
            ]
        }
}

let untilFirst : VirtualDOM = {
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

export function infoView(text: string){

    let infoToggled$ = new BehaviorSubject(false)
    return child$(
        infoToggled$,
        (toggled) => {
            return {
                class:'p-1 d-flex',
                children:[
                    {   tag:'i', 
                        class:'fas fa-info fv-hover-bg-background-alt p-1 fv-pointer rounded ' 
                            + (toggled ? 'fv-bg-background-alt' : ''),
                        onclick: () => infoToggled$ .next(!infoToggled$.getValue())
                    },
                    toggled 
                        ? { class:'p-1 px-2 fv-bg-background-alt rounded', style:{'text-align': 'justify', 'font-style':'italic'},
                        innerText: text
                        }
                        : {}
                ]
            }
        }
    )
}
export function beforeView( sourceInput$: Observable<{data, configuration, context}>){

    let info = "Presented here is the latest input that have reached the adaptor, before any transformation. "+
    "The input that is actually reaching the module's implementation is presented below."
    return {
        class:'flex-grow-1 d-flex flex-column', style:{'min-height':'0'},
        children:[
            infoView(info),
            dataTreeView(sourceInput$, 'input')
        ]
    }
}

export function moduleInputView(
    sourceInput$: Observable<{data, configuration, context}>, 
    codeContent$: Observable<string>, 
    mdleEnd: ModuleFlow
    ){
    let info = "Presented here is the input that is actually reaching the module's implementation. "+
    "Here, the configuration part of the input is merging the default one (defined in module's settings) "+
    "with the one returned by the adaptor (as presented in the previous tab)."
    
    let input$ = combineLatest([
        codeContent$.pipe(debounceTime(0.5)),
        sourceInput$
    ]).pipe(
        map( ([content, data]) => { 
            try{
                let result = new Function(content)()(data, mdleEnd.helpers)
                result.configuration = _.merge({},mdleEnd.getConfiguration(), result.configuration)
                return result
            }
            catch(e){
                return undefined
            }
        })
    )
    return {
        class:'flex-grow-1 d-flex flex-column', style:{'min-height':'0'},
        children:[
            infoView(info),
            dataTreeView(input$, 'input')
        ]
    }
}

function dataTreeView(input$, rootNodeName){
   
    let expandedNodes = [rootNodeName+"_0"]
    return {
        class:'cm-s-blackboard overflow-auto flex-grow-1', style:{'min-height':'0px'},
        children:[
            child$(
                input$,
                (result) => {
                    if(!result)
                        return { 'innerText': 'code not valid', class:'p-3'}

                    let rootNode = nodeFactory(rootNodeName, result, 0)

                    let treeState = new DataTreeState({
                        rootNode,
                        expandedNodes:expandedNodes
                    } as any)
                    let treeView = new ImmutableTree.View({
                        state: treeState,
                        headerView: dataNodeHeaderView,
                        connectedCallback: (elem) => {
                            elem.subscriptions.push(
                                treeState.expandedNodes$.subscribe( nodes => expandedNodes = nodes)
                            )
                        }
                    } as any)
                    return treeView
                },
                { untilFirst }
            )
        ]
    }
}

function invalidParsingView(error: ExecutionError){
    return {
        class: 'flex-grow-1 py-2', 
        style:{
            'min-height':'0px',
            'font-family': 'monospace'
        },
        children:[
            {
                innerText: 'error while executing the adaptor'
            },
            {
                innerText: `${error.message}.` + (error.row? ` Row:${error.row}, column:${error.col}` : '')
            }
        ]
    }
}

export function connectionStatusView(
    connection: Connection, 
    codeContent$: Observable<string>, 
    appStore:AppStore
    ): VirtualDOM {

    let mdleEnd = appStore.getModule(connection.end.moduleId) 
    
    let contract = mdleEnd.getInputSlot(connection.end.slotId).contract
    // The global window is used because the version of flux lib core used by flux-builder
    // may not be the one used by the workflow. 
    // window['@youwol/flux-lib-core'] is the one used by the workflow
    if(!contract || !(contract instanceof window['@youwol/flux-core'].Contract) )
        return {}

    let mdleStart = appStore.getModule(connection.start.moduleId)

    type Input = {data:unknown, configuration: {[key:string]:unknown}, context: {[key:string]:unknown}} | ExecutionError

    let input$ : Observable<Input> = combineLatest([
        codeContent$.pipe(debounceTime(0.5)),
        (mdleStart.getSlot(connection.start.slotId) as OutputSlot<any>).observable$
    ]).pipe(
        map( ([content, data]) => { 
            try{
                return new Function(content)()(data, mdleEnd.helpers)
            }
            catch(e){
                return parseError(e.stack)
            }
        })
    )
    let info = "Presented here is a blind test of the input that is reaching the module's implementation "+
    "with respect to its internal validation rules. \n Make sure the trigger turn green before updating the adaptor."

    let viewState = {
        expandedNodesRequired$: new BehaviorSubject<Array<string>>(['required']), 
        expandedNodesOptionals$: new BehaviorSubject<Array<string>>(['optionals']),
        expandedNodesTypingErrors$: new BehaviorSubject<Array<string>>(['typing errors_0']),
        expandedNodesMissings$: new BehaviorSubject<Array<string>>(['missing fields_0']),
        expandedNodesIntrus$: new BehaviorSubject<Array<string>>(['unexpected fields_0']),
        selectedTabId$: new BehaviorSubject<string>("data")
    }
    return { 
        style:{height:'33%', 'font-family': 'monospace'},
        class:'overflow-auto flex-grow-1 d-flex flex-column',
        children:[
            infoView(info),
            child$(
                input$,
                ( input: Input ) => {
                    if (input instanceof ExecutionError)
                        return invalidParsingView(input)
                    return inputStatusView( mdleEnd, input, contract, viewState )
                }
            )
        ]
    }
}

