
import { UiState, AppDebugEnvironment, LogLevel, AppStore} from '../builder-editor/builder-state/index';
import { Component } from '@youwol/flux-core';
import { createLayerPickerView } from './layer-picker.view';

export function commandsGeneral(appStore: AppStore, editor): Array<any> {
    
    let debugSingleton = AppDebugEnvironment.getInstance()
    let cmds = [
        ['toggle-render-view', {

            run(editor:any, sender:any) {

                if(appStore.uiState.mode=="builder")
                    appStore.setUiState(new UiState("combined",false,false))   
                if(appStore.uiState.mode=="none")
                    appStore.setUiState(new UiState("render",false,false))
            },
            stop(editor:any, sender:any) {
                
                if(appStore.uiState.mode=="combined")
                    appStore.setUiState(new UiState("builder",false,false))   
                if(appStore.uiState.mode=="render")
                    appStore.setUiState(new UiState("none",false,false))
            }
        }],
        ['toggle-builder-view', {
            run(editor:any, sender:any) {
         
                if(appStore.uiState.mode=="render")
                    appStore.setUiState(new UiState("combined",false,false))
                if(appStore.uiState.mode=="none")
                    appStore.setUiState(new UiState("builder",false,false))
            },
            stop(editor:any, sender:any) {
    
                if(appStore.uiState.mode=="combined")
                    appStore.setUiState(new UiState("render",false,false))
                if(appStore.uiState.mode=="builder")
                    appStore.setUiState(new UiState("none",false,false))
            }
        }],
        ['toggle-fullscreen', {
            run(editor:any, sender:any) {
                // see  document.addEventListener("fullscreenchange"...) callback
                document.documentElement.requestFullscreen();
            },
        }],
        ['duplicate-module', {
            run(editor:any, sender:any) { 
                let mdles = appStore.getModulesSelected()
                appStore.duplicateModules(mdles)
            }
        }],
        ['horizontal-align', {
            run(editor:any, sender:any) { 
                let mdles = appStore.getModulesSelected()
                appStore.alignH(mdles)
            }
        }],
        ['vertical-align', {
            run(editor:any, sender:any) { 
                let mdles = appStore.getModulesSelected()
                appStore.alignV(mdles)
            }
        }],
        ['group-module', {
            run(editor:any, sender:any) { 
                appStore.addGroup(appStore.getModulesSelected().map(m => m.moduleId))
            }
        }],
        ['group-as-component', {
            run(editor:any, sender:any) { 
                appStore.addComponent(appStore.getModulesSelected().map(m => m.moduleId))
            }
        }],
        ['publish-component', {
            run(editor:any, sender:any) { 
                appStore.publishComponent(appStore.getModuleSelected() as Component.Module)
            }
        }],
        ['display-tree-structure', {
            run(editor:any, sender:any) { 
                const div = createLayerPickerView(appStore, editor)
                document.getElementById("panel__app-tree-structure").innerHTML=""
                document.getElementById("panel__app-tree-structure").appendChild(div)
            }
        }
        ]
    ]
    document.addEventListener("fullscreenchange", () => {
        document.querySelectorAll(".controls-panel").forEach( control => control.classList.toggle("fullscreen"))
        editor.refresh()
    });

    debugSingleton.debugOn &&
    debugSingleton.logRenderTopic({ level:LogLevel.Info, message: "General commands",  object: { cmds  }})  
    return cmds
}
