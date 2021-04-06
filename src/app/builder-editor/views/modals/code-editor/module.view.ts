import { ModuleFlow } from "@youwol/flux-core"
import { DataNode, dataNodeHeaderView, DataTreeState, nodeFactory } from "../../data-tree.view"
import {ImmutableTree} from '@youwol/fv-tree'


export function moduleContextView(mdle: ModuleFlow){
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
    }
    */
   return {}
}