import { Component, ProjectSchema, RequirementsSchema } from '@youwol/flux-core'

const requirements: RequirementsSchema = {
    fluxPacks: ['flux-test'],
    loadingGraph: {
        definition: [
            [['assetId_flux-test', 'cdn/libraries/flux-test/0.0.0/bundle.js']],
        ],
        lock: [
            {
                id: 'assetId_flux-test',
                name: 'flux-test',
                version: '0.0.0',
                type: 'flux-pack',
            },
        ],
        graphType: 'sequential-v1',
    },
    fluxComponents: [],
    libraries: { 'flux-test': '0.0.0' },
}

export const projects: { [key: string]: ProjectSchema } = {
    emptyProject: {
        name: 'emptyProject',
        schemaVersion: '1',
        description: '',
        requirements,
        workflow: {
            modules: [Component.getRootComponentData()],
            connections: [],
            plugins: [],
        },
        builderRendering: {
            modulesView: [],
            descriptionsBoxes: [],
            connectionsView: [],
        },
    },
    simpleProject: {
        requirements,
        name: 'simpleProjects',
        schemaVersion: '1',
        description: '',
        workflow: {
            modules: [
                Component.getRootComponentData({
                    moduleIds: ['module0', 'GroupModules_child-layer'],
                }),
                {
                    moduleId: 'module0',
                    factoryId: { module: 'SimpleModule', pack: 'flux-test' },
                    configuration: {
                        title: 'saved title 0',
                        description: '',
                        data: {
                            property0: 1,
                        },
                    },
                },
                {
                    moduleId: 'module1',
                    factoryId: { module: 'SimpleModule', pack: 'flux-test' },
                    configuration: {
                        title: 'saved title 1',
                        description: '',
                        data: {
                            property0: 2,
                        },
                    },
                },
                {
                    moduleId: 'GroupModules_child-layer',
                    factoryId: {
                        module: 'GroupModules',
                        pack: '@youwol/flux-core',
                    },
                    configuration: {
                        title: 'group',
                        description: '',
                        data: {
                            environment: {},
                            explicitInputsCount: 0,
                            explicitOutputsCount: 0,
                            moduleIds: ['module1'],
                        },
                    },
                },
            ],
            connections: [
                {
                    end: {
                        slotId: 'input0',
                        moduleId: 'module0',
                    },
                    start: {
                        slotId: 'output0',
                        moduleId: 'module1',
                    },
                },
                {
                    end: {
                        slotId: 'input0-plugin',
                        moduleId: 'plugin0',
                    },
                    start: {
                        slotId: 'output0',
                        moduleId: 'module1',
                    },
                },
            ],
            plugins: [
                {
                    moduleId: 'plugin0',
                    parentModuleId: 'module0',
                    factoryId: { module: 'SimplePlugin', pack: 'flux-test' },
                    configuration: {
                        title: 'plugin0 title ',
                        description: '',
                        data: {
                            property0: 0,
                        },
                    },
                },
            ],
        },
        builderRendering: {
            modulesView: [
                {
                    moduleId: 'module0',
                    xWorld: 0,
                    yWorld: 0,
                },
                {
                    moduleId: 'module1',
                    xWorld: 10,
                    yWorld: 0,
                },
                {
                    moduleId: 'GroupModules_child-layer',
                    xWorld: 10,
                    yWorld: 0,
                },
            ],
            descriptionsBoxes: [
                {
                    descriptionBoxId: 'descriptionBoxId',
                    title: 'descriptionBoxTitle',
                    modulesId: ['module0'],
                    descriptionHtml: '',
                    properties: { color: 'blue' },
                },
            ],
            connectionsView: [],
        },
    },
    simpleProjectConnection: {
        requirements,
        name: 'simpleProjectConnection',
        schemaVersion: '1',
        description: '',
        workflow: {
            modules: [
                Component.getRootComponentData({
                    moduleIds: [
                        'module0',
                        'module2',
                        'module3',
                        'GroupModules_child-layer',
                    ],
                }),
                {
                    moduleId: 'module0',
                    factoryId: { module: 'SimpleModule', pack: 'flux-test' },
                    configuration: {
                        title: 'saved title 0',
                        description: '',
                        data: {
                            property0: 1,
                        },
                    },
                },
                {
                    moduleId: 'module1',
                    factoryId: { module: 'SimpleModule', pack: 'flux-test' },
                    configuration: {
                        title: 'saved title 1',
                        description: '',
                        data: {
                            property0: 2,
                        },
                    },
                },
                {
                    moduleId: 'module2',
                    factoryId: { module: 'SimpleModule', pack: 'flux-test' },
                    configuration: {
                        title: 'saved title 2',
                        description: '',
                        data: {
                            property0: 2,
                        },
                    },
                },
                {
                    moduleId: 'module3',
                    factoryId: { module: 'SimpleModule', pack: 'flux-test' },
                    configuration: {
                        title: 'saved title 3',
                        description: '',
                        data: {
                            property0: 2,
                        },
                    },
                },
                {
                    moduleId: 'GroupModules_child-layer',
                    factoryId: {
                        module: 'GroupModules',
                        pack: '@youwol/flux-core',
                    },
                    configuration: {
                        title: 'group',
                        description: '',
                        data: {
                            environment: {},
                            explicitInputsCount: 0,
                            explicitOutputsCount: 0,
                            moduleIds: ['module1'],
                        },
                    },
                },
            ],
            connections: [
                {
                    end: {
                        slotId: 'input0',
                        moduleId: 'module0',
                    },
                    start: {
                        slotId: 'output0',
                        moduleId: 'module1',
                    },
                    adaptor: {
                        mappingFunction: 'return (r)=>r',
                        adaptorId: 'fake adaptor',
                    },
                },
                {
                    end: {
                        slotId: 'input0-plugin',
                        moduleId: 'plugin0',
                    },
                    start: {
                        slotId: 'output0',
                        moduleId: 'module1',
                    },
                },
                {
                    end: {
                        slotId: 'input0',
                        moduleId: 'module0',
                    },
                    start: {
                        slotId: 'output0',
                        moduleId: 'module2',
                    },
                },
                {
                    end: {
                        slotId: 'input0',
                        moduleId: 'module1',
                    },
                    start: {
                        slotId: 'output0',
                        moduleId: 'module3',
                    },
                },
            ],
            plugins: [
                {
                    moduleId: 'plugin0',
                    parentModuleId: 'module0',
                    factoryId: { module: 'SimplePlugin', pack: 'flux-test' },
                    configuration: {
                        title: 'plugin0 title ',
                        description: '',
                        data: {
                            property0: 0,
                        },
                    },
                },
            ],
        },
        builderRendering: {
            connectionsView: [],
            modulesView: [
                {
                    moduleId: 'module0',
                    xWorld: 0,
                    yWorld: 0,
                },
                {
                    moduleId: 'module1',
                    xWorld: 10,
                    yWorld: 0,
                },
                {
                    moduleId: 'module2',
                    xWorld: -10,
                    yWorld: 0,
                },
                {
                    moduleId: 'module3',
                    xWorld: -10,
                    yWorld: 5,
                },
                {
                    moduleId: 'GroupModules_child-layer',
                    xWorld: 10,
                    yWorld: 0,
                },
            ],
            descriptionsBoxes: [
                {
                    descriptionBoxId: 'descriptionBoxId',
                    title: 'descriptionBoxTitle',
                    modulesId: ['module0'],
                    descriptionHtml: '',
                    properties: { color: 'blue' },
                },
            ],
        },
    },
}
