/** @format */

import { VirtualDOM } from '@youwol/flux-view'
import { resizablePanel } from '@youwol/fv-group'

export function factoryGrapejsEditorView(): VirtualDOM {
    return {
        id: 'grapejs-editor_view',
        class: 'w-100 d-flex',
        children: [
            {
                id: 'editor-row',
                class: 'd-flex h-100 w-100',
                children: [
                    {
                        id: 'gjs',
                    },
                    resizablePanel(
                        {
                            id: 'panel__right_render',
                            class: 'flex-grow-1',
                            children: [
                                {
                                    class: 'd-flex justify-content-between ',
                                    children: [
                                        {
                                            id: 'panel__layout-basic-actions',
                                            class: 'd-block position-relative  buttons-toolbox',
                                        },
                                        {
                                            id: 'panel__layout-devices-actions',
                                            class: 'd-block position-relative buttons-toolbox',
                                        },
                                    ],
                                },
                                {
                                    id: 'panel__layout-managers-actions',
                                    class: 'd-flex position-relative  flex-align-switch justify-content-between ',
                                    children: [
                                        {
                                            id: 'panel__render-panels-actions',
                                            class: 'd-block position-relative buttons-toolbox ',
                                        },
                                    ],
                                },
                                {
                                    id: 'panels-container-render',
                                    class: 'overflow-auto  p-1 border border-dark panels-container',
                                    style: {
                                        height: 'calc(100% - 80px)',
                                    },
                                    children: [
                                        {
                                            id: 'blocks',
                                        },
                                        {
                                            id: 'styles',
                                        },
                                        {
                                            id: 'traits',
                                        },
                                        {
                                            id: 'layers',
                                        },
                                        {
                                            id: 'codes',
                                        },
                                    ],
                                },
                            ],
                        },
                        'Toolboxes',
                        'right',
                        { minWidth: 195 },
                    ),
                ],
            },
        ],
    }
}
