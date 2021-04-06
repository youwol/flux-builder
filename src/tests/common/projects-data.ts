import { ProjectSchema, RequirementsSchema } from "@youwol/flux-core"

let requirements : RequirementsSchema= {
  fluxPacks:["flux-test"],
  loadingGraph:{ 
      definition:[
          [["assetId_flux-test", "cdn/libraries/flux-test/0.0.0/bundle.js"]]
      ], 
      lock:[
          { id:"assetId_flux-test", name:"flux-test", version:"0.0.0", type:'flux-pack' }
      ],
      graphType:"sequential-v1"
  },
  fluxComponents:[],
  libraries:{'flux-test':'0.0.0'},
}

export let projects : {[key:string]:ProjectSchema}={

    emptyProject :{
        name:'emptyProject',
        description:'',
        requirements,
        workflow: {
            modules:[],
            connections:[],
            plugins:[],
            rootLayerTree:{
                layerId:"",
                title:"",
                children:[],
                moduleIds:[]
            }
        },
        builderRendering:{
            modulesView:[],
            descriptionsBoxes:[],
            connectionsView:[]
        },
        runnerRendering :{
            style:"",
            layout:""
        }
    },
    simpleProject :{
        requirements,
        name:'simpleProjects',
        description:"",
        workflow: {
            modules:[
                {
                    moduleId:"module0",
                    factoryId: {module:"SimpleModule", pack:"flux-test"},
                    configuration: {
                        title: "saved title 0",
                        description: "",
                        data: {
                          property0: 1
                        }
                      },
                },
                {
                    moduleId:"module1",
                    factoryId: {module:"SimpleModule", pack:"flux-test"},
                    configuration: {
                        title: "saved title 1",
                        description: "",
                        data: {
                          property0: 2
                        }
                      },
                },
                {
                    moduleId:"GroupModules_child-layer",
                    factoryId: {module:"GroupModules", pack:"@youwol/flux-core"},
                    configuration: {
                        title: "group",
                        description: "",
                        data: { 
                            environment:{},
                            explicitInputsCount: 0,
                            explicitOutputsCount: 0
                        }
                      },
                }
            ],
            connections:[{
              end: {
                  slotId: "input0",
                  moduleId: "module0"
                },
                start: {
                  slotId: "output0",
                  moduleId: "module1"
                }
            },{
              end: {
                  slotId: "input0-plugin",
                  moduleId: "plugin0"
                },
                start: {
                  slotId: "output0",
                  moduleId: "module1"
                }
            }],
            plugins:[{
                moduleId:"plugin0",
                parentModuleId:"module0",
                factoryId: {module:"SimplePlugin", pack:"flux-test"}, 
                configuration: {
                    title: "plugin0 title ",
                    description: "",
                    data: {
                        property0: 0,
                    }
                  },
            }],
            rootLayerTree:{
                layerId:"root layer",
                title:"",
                children:[{
                    layerId:"child-layer",
                    title:"child-layer_title",
                    children:[],
                    moduleIds:["module1"]             
                }],
                moduleIds:["module0","GroupModules_child-layer"]
            }
        },
        builderRendering:{
            modulesView:[{
                moduleId: "module0",
                xWorld:0,
                yWorld:0
            },
            {
                moduleId: "module1",
                xWorld:10,
                yWorld:0
            },
            {
                moduleId: "GroupModules_child-layer",
                xWorld:10,
                yWorld:0
            }],
            descriptionsBoxes:[{
                descriptionBoxId:"descriptionBoxId",
                title: "descriptionBoxTitle",
                modulesId: ["module0"],
                descriptionHtml: "",
                properties: {color:"blue"}
            }],
            connectionsView:[]
        },
        runnerRendering :{
            style:"",
            layout:""
        }
    },
    simpleProjectConnection :{
        requirements,
        name:"simpleProjectConnection",
        description:"",
        workflow: {
            modules:[
                {
                    moduleId:"module0",
                    factoryId: {module:"SimpleModule", pack:"flux-test"},
                    configuration: {
                        title: "saved title 0",
                        description: "",
                        data: {
                          property0: 1
                        }
                      },
                },
                {
                    moduleId:"module1",
                    factoryId: {module:"SimpleModule", pack:"flux-test"},
                    configuration: {
                        title: "saved title 1",
                        description: "",
                        data: {
                          property0: 2
                        }
                      },
                },
                {
                    moduleId:"module2",
                    factoryId: {module:"SimpleModule", pack:"flux-test"},
                    configuration: {
                        title: "saved title 2",
                        description: "",
                        data: {
                          property0: 2
                        }
                      },
                },
                {
                    moduleId:"module3",
                    factoryId: {module:"SimpleModule", pack:"flux-test"},
                    configuration: {
                        title: "saved title 3",
                        description: "",
                        data: {
                          property0: 2
                        }
                      },
                },
                {
                    moduleId:"GroupModules_child-layer",
                    factoryId: {module:"GroupModules", pack:"@youwol/flux-core"},
                    configuration: {
                        title: "group",
                        description: "",
                        data: { 
                            environment:{},
                            explicitInputsCount: 0,
                            explicitOutputsCount: 0
                        }
                      },
                }
            ],
            connections:[{
                end: {
                  slotId: "input0",
                  moduleId: "module0"
                },
                start: {
                  slotId: "output0",
                  moduleId: "module1"
                },
                adaptor: {
                  configuration: {title: "adaptor", description: "", data: {code:"return (r)=>r"}},
                  adaptorId: "fake adaptor"
                }
            },{
              end: {
                  slotId: "input0-plugin",
                  moduleId: "plugin0"
                },
                start: {
                  slotId: "output0",
                  moduleId: "module1"
                }
            },{
              end: {
                    slotId: "input0",
                    moduleId: "module0"
                },
                start: {
                  slotId: "output0",
                  moduleId: "module2"
                }
            },
            {
                end: {
                      slotId: "input0",
                      moduleId: "module1"
                  },
                  start: {
                    slotId: "output0",
                    moduleId: "module3"
                  }
              }],
            plugins:[{
                moduleId:"plugin0",
                parentModuleId:"module0",
                factoryId:{module:"SimplePlugin", pack:"flux-test"},
                configuration: {
                    title: "plugin0 title ",
                    description: "",
                    data: {
                        property0: 0 
                    }
                  },
            }],
            rootLayerTree:{
                layerId:"root layer",
                title:"",
                children:[{
                    layerId:"child-layer",
                    title:"",
                    children:[],
                    moduleIds:["module1"]
                }],
                moduleIds:["module0","module2","module3","GroupModules_child-layer"]
            }
        },
        builderRendering:{
            connectionsView:[],
            modulesView:[{
                moduleId: "module0",
                xWorld:0,
                yWorld:0
            },
            {
                moduleId: "module1",
                xWorld:10,
                yWorld:0
            },
            {
                moduleId: "module2",
                xWorld:-10,
                yWorld:0
            },
            {
                moduleId: "module3",
                xWorld:-10,
                yWorld:5
            },
            {
                moduleId: "GroupModules_child-layer",
                xWorld:10,
                yWorld:0
            }],
            descriptionsBoxes:[{
                descriptionBoxId:"descriptionBoxId",
                title: "descriptionBoxTitle",
                modulesId: ["module0"],
                descriptionHtml: "",
                properties: {color:"blue"}
            }]
        },
        runnerRendering :{
            style:"",
            layout:""
        }
    }
}