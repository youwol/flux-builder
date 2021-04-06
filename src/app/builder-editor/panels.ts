export function getBuilderPanels(): Array<any> {

    return [{
            id: 'app-builder-extensions',
            el: '#extensions-panel'
        }, {
            id: 'app-builder-modules',
            el: '#modules-panel',
            buttons: []
        },{
            id: 'app-builder-components',
            el: '#components-panel',
            buttons: []
        },{
            id: 'app-builder-attributes',
            el: '#attributes-panel',
            buttons: []
        },
        {
            id: 'builder-managers-actions',
            el: '#panel__builder-managers-actions',
            buttons: [
                {
                    id: 'show-attributes',
                    active: false,
                    label: '<i class="fas fa-tools"></i>',
                    command: 'show-attributes',
                },
                /*
                {
                    id: 'show-suggestions',
                    active: false,
                    label: '<i class="fas fa-lightbulb"></i>',
                    command: 'show-suggestions',
                },
                {
                    id: 'show-extensions',
                    active: false,
                    label: '<i class="fas fa-puzzle-piece"></i>',
                    command: 'show-extensions',
                }
            */
           ]
        },
        {
            id: 'builder-show-actions',
            el: '#panel__builder-show-actions',
            buttons: [
                {
                    id: 'show-hide-panels',
                    active: false,
                    label: '<i class="fas fa-eye"></i>',
                    command: 'show-hide-panels',
                }
            ]
        }]
}