import { ErrorLog, ModuleError, ModuleFlux } from '@youwol/flux-core';
import { render } from '@youwol/flux-view';
import { filter } from 'rxjs/operators';
import { WorkflowPlotter } from './builder-editor/builder-plots';
import { AppStore } from './builder-editor/builder-state';
import { ContextView } from './builder-editor/views/context.view';


/**
 * Focus a module in the workflow by toggeling a provided class on the module's svg group element for 
 * a provided duration. Focusing means: 
 * -    the active layer is changed to the mdoule's containing layer if need be
 * -    the builder canvas is translated such that the module is located at its center
 * -    if styles are associated to the toggeling class, those are applied during the specified duration
 * 
 * @param mdle module to focus
 * @param appStore reference to the appStore of the application
 * @param workflowPlotter reference to the workflow plotter of the application
 * @param toggledClass name of the toggeling class
 * @param duration duration of the focus
 */
function focusAction(
    mdle: ModuleFlux, 
    appStore: AppStore, 
    workflowPlotter: WorkflowPlotter,
    toggledClass: string,
    duration: number = 5000 ) {
     
    let root = appStore.project.workflow.rootLayerTree
    let layer = root.getLayerRecursive((layer) => layer.moduleIds.includes(mdle.moduleId) )
    appStore.selectActiveLayer(layer.layerId)
    
    setTimeout( () => {
        let g = document.getElementById(mdle.moduleId)
        let bBox = g.getBoundingClientRect()
        workflowPlotter.drawingArea.lookAt( 0.5*(bBox.left + bBox.right),  0.5*(bBox.top + bBox.bottom))
        g.classList.toggle(toggledClass)
        setTimeout( () => g.classList.toggle(toggledClass), duration )
    }, 0 )
}

/**
 * Plug the notification system to the application environment.
 * For now, only module's errors (ModuleError in flux-core) are handled.
 * 
 * @param appStore reference to the appStore of the application
 * @param workflowPlotter reference to the workflow plotter of the application
 */
export function plugNotifications(
    appStore: AppStore,
    workflowPlotter: WorkflowPlotter){

    appStore.environment.errors$.pipe(
        filter(  (log:ErrorLog) => log.error instanceof ModuleError )
    ).subscribe(
        (log:ErrorLog<ModuleError>) => Notifier.error({ 
            message: log.error.message, 
            title:  log.error.module.Factory.id, 
            actions: [
                {
                    name: 'focus', 
                    exe: () => focusAction(log.error.module, appStore, workflowPlotter, "error") 
                },
                {
                    name: 'report',
                    exe: () => ContextView.displayModuleErrorModal(log)
                }
            ]
        })
    )
}

/**
 * Interface for notifier's action
 */
export interface INotifierAction{

    /**
     * displayed name of the action
     */
    name : string

    /**
     * execution function 
     */
    exe : () => void
}

/**
 * This class provides a notification system that popups message in the 
 * HTML document.
 * 
 * For now, only module's errors (ModuleError in flux-core) are handled.
 * 
 * Notification can be associated to custom [[INotifierAction | action]]
 */
export class Notifier{

    static classesIcon={
        4: "fas fa-2x fa-exclamation-circle text-danger px-2 mt-auto mb-auto",
        3: "fas fa-2x fa-exclamation text-warning px-2 mt-auto mb-auto",
    }
    static classesBorder={
        4: "border-danger",
        3: "border-warning",
    }

    constructor( public readonly appStore: AppStore){

    }
    /**
     * Popup a notification with level=='Info'
     * 
     * @param message content
     * @param title title
     * @param actions available actions
     */
    static notify({message, title, actions}:{
        message: string,
        title: string
        actions: INotifierAction[]
    }){

        Notifier.popup( { message, title, actions, classIcon:"", classBorder:"" } )
    }
    /**
     * Popup a notification with level=='Error'
     * 
     * @param message content
     * @param title title
     * @param actions available actions
     */
    static error( {message, title, actions}:{
        message: string,
        title: string
        actions: INotifierAction[]
    }){

        Notifier.popup( { message, title, actions, classIcon:Notifier.classesIcon[4], classBorder:Notifier.classesBorder[4] } )
    }
    /**
     * Popup a notification with level=='Warning'
     * 
     * @param message content
     * @param title title
     * @param actions available actions
     */
    static warning( {message, title, actions}:{
        message: string,
        title: string
        actions: INotifierAction[]
    }){

        Notifier.popup( { message, title, actions, classIcon:Notifier.classesIcon[3], classBorder:Notifier.classesBorder[3] } )
    }

    private static popup( { message, title, actions, classIcon, classBorder } :{
        message: string,
        title: string
        actions: INotifierAction[],
        classIcon: string,
        classBorder: string
    }){

        let view = {
            class:"m-2 p-2 my-1 bg-white " + classBorder,
            style: {border:'solid'},
            children:[
                {
                    class:"fas fa-times",
                    style:{float:'right',cursor:'pointer'},
                    onclick: (event)=> {
                        event.target.parentElement.remove()
                    } 
                },
                {
                    class:'d-flex py-2',
                    children:[
                        {tag:'i', class: classIcon },
                        {
                            children:[
                                {tag:'span', class:'d-block',innerText:title},
                                {tag:'span', class:'d-block', innerText:message}
                            ]
                        }
                    ]
                },
                {
                    class:'d-flex align-space-around',
                    children: actions.map( action => ({
                        tag:'span', 
                        class:"px-1 mx-1 ", 
                        innerText: action.name, 
                        onclick: ()=>action.exe(), 
                        style: {cursor:'pointer', 'background-color': 'darkslategrey', color:'white'}
                    }))
                }
            ]
        }
        let div = render(view)
        document.getElementById("notifications-container").appendChild(div)
    }
}