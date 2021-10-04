
import { AppStore } from '../builder-editor/builder-state/index'
import { ShareUriView } from '../builder-editor/views/share-uri.view'

export function getGeneralPanels(appStore: AppStore) {

  return [{
    id: 'app-basic-actions',
    el: '#panel__app-basic-actions',
    buttons: [
      {
        id: 'save-project',
        className: 'btn-save-project',
        label: '<i class="fas fa-save panel-action" data-toggle="tooltip" title="Save project" ></i>',
        command(editor: any) { appStore.saveProject() }
      },
      {
        id: 'share-uri',
        className: 'btn-share-uri',
        label: '<i class="fas fa-link panel-action" data-toggle="tooltip" title="share uri" ></i>',
        command(editor: any) { ShareUriView.popupModal(appStore) }
      },
      {
        id: 'undo',
        className: 'btn-undo',
        label: '<i class="fas fa-undo panel-action" data-toggle="tooltip" title="Undo" ></i>',
        command(editor: any) { appStore.undo() }
      },
      {
        id: 'redo',
        className: 'btn-redo',
        label: '<i class="fas fa-redo panel-action" data-toggle="tooltip" title="Redo" ></i>',
        command(editor: any) { appStore.redo() }
      }/*,
      {
        id: 'settings',
        className: 'btn-settings',
        label: '<i class="fas fa-cog panel-action" data-toggle="tooltip" title="open settings panel" ></i>',
        command(editor: any) { appStore.projectSettings() }
      }*/
    ],
  },
  {
    id: 'app-layout-builder-actions',
    el: '#panel__app-layout-builder-actions',
    buttons: [
      {
        id: 'toggle-builder-view',
        active: true, // active by default
        className: 'app-layout-builder-actions',
        label: '<i id="toggle-builder-view" class="fas fa-project-diagram  panel-action" data-toggle="tooltip" title="Toggle builder view"></i>',
        command: 'toggle-builder-view'
      }]
  },
  {
    id: 'app-layout-render-actions',
    el: '#panel__app-layout-render-actions',
    buttons: [
      {
        id: 'toggle-render-view',
        className: 'app-layout-render-actions',
        label: '<i id="toggle-render-view" class="fas fa-eye  panel-action" data-toggle="tooltip" title="Toggle builder view"></i>',
        command: 'toggle-render-view'
      },
    ],
  },
  {
    id: 'app-layout-actions',
    el: '#panel__app-layout-actions',
    buttons: [
      {
        id: 'toggle-full-screen',
        active: false,
        className: 'app-layout-actions',
        label: '<i id="toggle-render-view" class="fas fa-expand  panel-action" data-toggle="tooltip" title="Fullscreen mode"></i>',
        command: 'toggle-fullscreen',
        toggable: false
      },
    ],
  },
  {
    id: 'panel__app-selection-actions',
    el: '#panel__app-selection-actions',
    buttons: [
      {
        id: 'duplicate-module',
        active: false, // active by default
        className: 'selection-actions',
        label: '<i id="toggle-render-view" class="fas fa-clone panel-action" data-toggle="tooltip" title="duplicate selected modules"></i>',
        command: 'duplicate-module',
        toggable: false
      },
      {
        id: 'horizontal-align',
        active: false, // active by default
        className: 'selection-actions',
        label: '<i id="toggle-render-view" class="fas fa-ruler-vertical panel-action" data-toggle="tooltip" title="horizontal align selected modules"></i>',
        command: 'horizontal-align',
        toggable: false
      },
      {
        id: 'vertical-align',
        active: false, // active by default
        className: 'selection-actions',
        label: '<i id="toggle-render-view" class="fas fa-ruler-horizontal panel-action" data-toggle="tooltip" title="vertical align selected modules"></i>',
        command: 'vertical-align',
        toggable: false
      },
      {
        id: 'group-module',
        active: false, // active by default
        className: 'selection-actions',
        label: '<i id="toggle-render-view" class="fas fa-object-group panel-action" data-toggle="tooltip" title="group selected modules"></i>',
        command: 'group-module',
        toggable: false
      }
    ],
  }, {
    id: 'panel__app-component-actions',
    el: '#panel__app-component-actions',
    buttons: [
      {
        id: 'create-component',
        active: false, // active by default
        className: 'selection-actions',
        label: '<i id="create-component" class="fas fa-cube panel-action" data-toggle="tooltip" title="create a component from selected modules"></i>',
        command: 'group-as-component',
        toggable: false
      },
      {
        id: 'publish-component',
        active: false, // active by default
        className: 'selection-actions',
        label: '<i id="publish-component" class="fas fa-upload panel-action" data-toggle="tooltip" title="publish selected component"></i>',
        command: 'publish-component',
        toggable: false
      }
    ]
  },
  {
    id: 'panel__app-tree-structure',
    el: '#panel__app-tree-structure',
    buttons: [
      {
        id: 'display-tree-structure',
        active: false, // active by default
        className: 'tree-structure',
        label: '<label class="text-light border px-2" >active layer <i class="fas fa-caret-down pl-2"></i> </label>',
        command: 'display-tree-structure',
        toggable: false
      }
    ]
  }
  ]
}