
import { ConfigurationStatus, mergeConfiguration, Contract, ExpectationStatus, 
    ModuleFlow, 
    UnconsistentConfiguration,
    ConsistentConfiguration,
    IExpectation} from '@youwol/flux-core'
import { VirtualDOM} from '@youwol/flux-view'
import { BehaviorSubject } from 'rxjs'
import {ImmutableTree} from '@youwol/fv-tree'
import { AllOfNode, AnyOfNode, OfNode, parseReport, ReportNode } from './input-validation'
import { dataNodeHeaderView, DataTreeState, nodeFactory } from '../data-tree.view'

import { Tabs } from '@youwol/fv-tabs'


class  DataTab extends Tabs.TabData{
    constructor(){super('data', 'data')}
}
class ConfigTab extends Tabs.TabData{
    constructor(){super('configuration', 'configuration')}
}


export function inputStatusView(
    mdle: ModuleFlow,
    input: {data: unknown, configuration: {[key:string]: unknown}, context: {[key:string]: unknown}},
    contract: IExpectation<unknown>, 
    {   expandedNodesRequired$, expandedNodesOptionals$, selectedTabId$, 
        expandedNodesTypingErrors$, expandedNodesIntrus$, expandedNodesMissings$ } : 
    {
        expandedNodesRequired$?: BehaviorSubject<Array<string>>, 
        expandedNodesOptionals$?: BehaviorSubject<Array<string>>,
        selectedTabId$?: BehaviorSubject<string>,
        expandedNodesTypingErrors$?: BehaviorSubject<Array<string>>,
        expandedNodesIntrus$?: BehaviorSubject<Array<string>>, 
        expandedNodesMissings$?: BehaviorSubject<Array<string>>
    } = {}
): VirtualDOM{

    expandedNodesRequired$ =  expandedNodesRequired$ || new BehaviorSubject<Array<string>>(['required']), 
    expandedNodesOptionals$ = expandedNodesOptionals$ || new BehaviorSubject<Array<string>>(['optionals']),
    expandedNodesTypingErrors$ = expandedNodesTypingErrors$ || new BehaviorSubject<Array<string>>(['typing errors_0']),
    expandedNodesMissings$ = expandedNodesMissings$ || new BehaviorSubject<Array<string>>(['missing fields_0']),
    expandedNodesIntrus$ = expandedNodesIntrus$ || new BehaviorSubject<Array<string>>(['unexpected fields_0']),
    selectedTabId$ = selectedTabId$ || new BehaviorSubject<string>("data")

    let configStatus = mergeConfiguration(mdle, input.configuration)
    
    let dataStatus = (contract && (contract instanceof window['@youwol/flux-core'].Contract ) ) 
        ? contract.resolve(input.data)
        : undefined
    
    let tabState = new Tabs.State([new DataTab(), new ConfigTab()],selectedTabId$)

    let tabView = new Tabs.View({
        state: tabState,
        contentView: (state, data) => { 
            if(data instanceof DataTab)
                return dataStatusView(dataStatus, contract, expandedNodesRequired$,expandedNodesOptionals$)

            if(data instanceof ConfigTab)
                return configurationStatusView(configStatus, expandedNodesTypingErrors$, expandedNodesMissings$, expandedNodesIntrus$ )
        },
        headerView: (state, data) => { 

            if(data instanceof DataTab)
                return dataHeaderView(dataStatus)

            if(data instanceof ConfigTab)
                return configurationHeaderView(configStatus)

            return {innerText:data.name, class:"px-2"}
        },
        class:'flex-grow-1 d-flex flex-column', style:{'min-height':'0px'},
        options:{
            containerStyle:{'min-height':'0px'},
            containerClass: 'p-2 border flex-grow-1 overflow-auto'
        }
    }as any)

    return tabView
}


export function dataHeaderView(status: ExpectationStatus<any>){
    
    let classes = 'fas fa-check fv-text-success px-1'
    if(!status)
        classes = 'fas fa-question px-1'
    else if(!status.succeeded)  
        classes = 'fas fa-times fv-text-error px-1'
    return {
        class:'d-flex align-items-center px-2',
        children:[
            { class: classes},
            {innerText: 'data'}
        ]
    }
}

export function dataStatusView( 
    dataStatus: ExpectationStatus<any>, 
    contract: IExpectation<unknown>, 
    expandedNodesRequired$: BehaviorSubject<Array<string>>, 
    expandedNodesOptionals$: BehaviorSubject<Array<string>>
    ): VirtualDOM{

    if(!dataStatus)
        return { innerText: "No input's contract has been defined by the module for this slot"}

    let treeNode = parseReport(dataStatus)
    let treeStateRequired = new ImmutableTree.State({rootNode: treeNode.children[0],expandedNodes:expandedNodesRequired$})
    let treeStateOptionals = new ImmutableTree.State({rootNode: treeNode.children[1],expandedNodes:expandedNodesOptionals$})

    return {
        class: 'flex-grow-1 d-flex flex-column', 
        style:{
            'min-height':'0px',
        },
        children:[
            {
                class:'d-flex align-items-center',
                children:[
                    {
                        class: dataStatus.succeeded ? 'fas fa-check fv-text-success' : 'fas fa-times fv-text-error',
                        style:{'min-width':'25px'}
                    },
                    {   class: 'px-2',
                        innerText: contract.description
                    }
                ]                
            },
            {
                class:'pl-2 flex-grow-1 overflow-auto ', style:{'min-height':'0px'},
                children:[
                    {
                        class:'pl-2',
                        children:[
                            new ImmutableTree.View({state:treeStateRequired, headerView}),                
                            new ImmutableTree.View({state:treeStateOptionals, headerView}),
                        ]
                    }
                ]
            }
        ]
    }
}


export function configurationHeaderView(status: ConfigurationStatus<unknown>){

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


export function configurationStatusView( 
    status: ConfigurationStatus<unknown>, 
    expandedNodesTypingErrors$,
    expandedNodesMissings$, 
    expandedNodesIntrus$
    ): VirtualDOM{

    let createTreeView = ( title, data, expandedNodes$) => {
        let rootNode = nodeFactory(title, data, 0)
        let state = new DataTreeState({
            rootNode,
            stringLengthLimit:100,
            expandedNodes:  expandedNodes$
        } as any)
        return new ImmutableTree.View({
            state: state,
            headerView: dataNodeHeaderView,
            class:"cm-s-blackboard"
        } as any)
    }
    
    if(status instanceof ConsistentConfiguration && status.intrus.length == 0)
        return { innerText: 'Your configuration is validated'}

    let typeErrorsView = status instanceof UnconsistentConfiguration && status.typeErrors.length > 0
        ? createTreeView('typing errors', status.typeErrors, expandedNodesTypingErrors$ )
        : {}
        
    let missingsView = typeErrorsView = status instanceof UnconsistentConfiguration && status.missings.length > 0
        ? createTreeView('missing fields', status.missings, expandedNodesMissings$ )
        : {}

    let intrusView = status.intrus.length>0
        ? createTreeView('unexpected fields', status.intrus, expandedNodesIntrus$ )
        : {}  
    return {
        children:[
            typeErrorsView,
            missingsView,
            intrusView
        ]
    }
}


function headerView(_, node: ReportNode) {

    let classes = ""
    if(node.isRealized)
        classes = "fv-text-success"
    if(node.isRealized==false)
        classes = "fv-text-error"
    if(node.isRealized==undefined)
        classes = "fv-text-disabled"

    let icon = ""
    if(node.isRealized)
        icon = "fas fa-check fv-text-success px-1"
    if(node.isRealized==false)
        icon = "fas fa-times fv-text-error px-1"
    if(node instanceof AllOfNode){
        return {
            class: 'd-flex',
            children:[
                { innerText: node.name, class:'fv-text-primary'},
                { class :classes + " "+icon},
                { tag:'i', class:'fv-text-primary', innerText: "All of the following:"}]
        }
    }
    if(node instanceof AnyOfNode){
        return {
            class: 'd-flex',
            children:[
                { innerText: node.name, class:'fv-text-primary'},
                { class :classes + " "+icon},
                { tag:'i', class:'fv-text-primary', innerText: "Any of the following:"}]
        }
    }
    if(node instanceof OfNode){
        return {
            class:'d-flex flex-align-items-center ',
            children:[
                { innerText: node.name, class:classes },
                { class: icon}
            ]
        }
    }
    return {
        class :classes,
        innerText: node.name
    }
}
