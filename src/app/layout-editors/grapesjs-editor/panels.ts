export function getRenderPanels() {
    return [
        {
            id: 'layout-basic-actions',
            el: '#panel__layout-basic-actions',
            buttons: [
                {
                    id: 'visibility',
                    active: true, // active by default
                    className: 'btn-toggle-borders',
                    label: '<i class="fas fa-border-none"></i>',
                    command: 'sw-visibility', // Built-in command
                },
            ],
        },
        {
            id: 'layout-show-actions',
            el: '#panel__render-show-actions',
            buttons: [
                {
                    id: 'preview',
                    className: 'btn-preview',
                    label: '<i class="fas fa-eye"></i>',
                    command: 'custom-preview', // Built-in command
                },
            ],
        },
        {
            id: 'layout-devices-actions',
            el: '#panel__layout-devices-actions',
            buttons: [
                {
                    id: 'desktop',
                    active: true, // active by default
                    className: 'btn-set-device-desktop',
                    label: '<i class="fas fa-desktop"></i>',
                    command: 'set-device-desktop',
                },
                {
                    id: 'tablet',
                    active: false, // active by default
                    className: 'btn-set-device-tablet',
                    label: '<i class="fas fa-tablet-alt"></i>',
                    command: 'set-device-tablet',
                },
                {
                    id: 'mobile landscape',
                    active: false, // active by default
                    className: 'btn-set-device-phone',
                    label: '<i class="fas fa-mobile-alt"></i>',
                    command: 'set-device-mobile-landscape',
                },
                {
                    id: 'mobile portrait',
                    active: false, // active by default
                    className: 'btn-set-device-phone',
                    label: '<i class="fas fa-mobile-alt"></i>',
                    command: 'set-device-mobile-portrait',
                },
            ],
        },
        {
            id: 'layout-managers-actions',
            el: '#panel__render-panels-actions',
            buttons: [
                {
                    id: 'show-blocks',
                    active: true,
                    label: '<i class="fas fa-th-large"></i>',
                    command: 'show-blocks',
                    // Once activated disable the possibility to turn it off
                    togglable: false,
                },
                {
                    id: 'show-style',
                    active: false,
                    label: '<i class="fas fa-palette"></i>',
                    command: 'show-styles',
                    togglable: false,
                },
                {
                    id: 'show-traits',
                    active: false,
                    className: 'fa fa-cog',
                    command: 'show-traits',
                    attributes: { title: 'Open Trait Manager' },
                    togglable: false,
                },
                {
                    id: 'show-layers',
                    active: false,
                    className: 'fa fa-bars',
                    command: 'show-layers',
                    attributes: { title: 'Open Layer Manager' },
                    togglable: false,
                },
                {
                    id: 'code',
                    className: 'btn-preview',
                    label: '<i class="fas fa-code"></i>',
                    command: 'open-code', // Built-in command
                },
            ],
        },
    ]

    /*
  editor.Panels.addPanel({
      id: 'layers',
      el: '.panel__right',
      // Make the panel resizable
      resizable: {
        maxDim: 350,
        minDim: 200,
        tc: 0, // Top handler
        cl: 1, // Left handler
        cr: 0, // Right handler
        bc: 0, // Bottom handler
        // Being a flex child we need to change `flex-basis` property
        // instead of the `width` (default)
        keyWidth: 'flex-basis',
      },
    })*/
}
