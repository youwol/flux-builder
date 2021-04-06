
import { ModuleFlow, Property, Flux, BuilderView, Pipe, RenderView, PluginFlow, freeContract, FluxPack} from '@youwol/flux-core';

export let testPack = new FluxPack({
    name:'flux-test',
    description: 'flux pack helpers to test',
    version: '0.0.0'
});


export namespace SimpleModule {

    export class PersistentData  {

        @Property({ description: "property0" })
        readonly property0 : number

        constructor( {property0} : {property0?: number }= {}) {
            this.property0 = property0 != undefined ? property0 : 0
        }
    }

    @Flux({
        pack:           testPack,
        namespace:      SimpleModule,
        id:             "SimpleModule",
        displayName:    "SimpleModule",
        description:    "A simple module"
    })
    @BuilderView({
        namespace:      SimpleModule,
        icon:           `<path d=""/>`
    })
    @RenderView({
        namespace:      SimpleModule,
        render : (mdle) => "<div type='test-div'></div>"
    })
    export class Module extends ModuleFlow{
        
        output0$ : Pipe<any>
    
        constructor(params){ 
            super(params)    
            this.addInput({ 
                id:"input0", 
                description: "",
                contract: freeContract(), 
                onTriggered: ({data}) => this.do(data) 
            })
            this.output0$ = this.addOutput({id:"output0"})
        }

        do(data){
            this.output0$.next(data);
         }
    }
}


export namespace SimpleModule2 {

    export class PersistentData  {

        @Property({ description: "property0" })
        readonly property0 : number

        constructor( {property0} : {property0?: number }= {}) {
            this.property0 = property0 != undefined ? property0 : 0
        }
    }

    @Flux({
        pack:           testPack,
        namespace:      SimpleModule2,
        id:             "SimpleModule2",
        displayName:    "SimpleModule",
        description:    "A simple module"
    })
    @BuilderView({
        namespace:      SimpleModule2,
        icon:           `<path d=""/>`
    })
    @RenderView({
        namespace:      SimpleModule2,
        render : (mdle) => "<div type='test-div'></div>"
    })
    export class Module extends ModuleFlow{
        
        output0$ : Pipe<any>
    
        constructor(params){ 
            super(params)    
            this.addInput({ 
                id:"input0", 
                description: "",
                contract: freeContract(), 
                onTriggered: ({data}) => this.do(data) 
            })
            this.output0$ = this.addOutput({id:"output0"})
        }

        do(data){
            this.output0$.next(data);
         }
    }
}


export namespace SimplePlugin {

    export class PersistentData  {

        @Property({ description: "property0" })
        readonly property0 : number

        constructor( {property0} : {property0?: number }= {}) {
            this.property0 = property0 != undefined ? property0 : 0
        }
    }

    @Flux({
        pack:           testPack,
        namespace:      SimplePlugin,
        id:             "SimplePlugin",
        displayName:    "SimplePlugin",
        description:    "plugin",
        compatibility:  { a: (mdle)=>true }
    })
    @BuilderView({
        namespace:      SimplePlugin,
        icon:           `<path d=""/>`,
        render:         (plugin)=> {
            let input = plugin.inputSlots[0]
            return `
            <rect height="40" width="150" class="module plugin content" x=-75 y=0 filter="url(#shadow)" ></rect>
            <line id="input-line_${input.slotId+"_"+ plugin.moduleId}" 
                class="plug input 2b995ff1-ec89-4597-89a0-c973f1648ee0" 
                x2="90"     y2="20" 
                x1="75"     y1="20">
            </line>
            <circle id="input-slot_${input.slotId+"_"+ plugin.moduleId}" 
                class="slot input picked-object" 
                cx="90" cy="20"> </circle>
            <text class="module-title" x="0" y="25" > ${plugin.configuration.title}</text>
            `
        } 
    })
    @RenderView({
        namespace:      SimplePlugin,
        render : (mdle) => "<div type='test-div'></div>"
    })
    export class Module extends PluginFlow<SimpleModule2.Module>{

        constructor(params){ 
            super(params)    
            this.addInput({ 
                id:"input0-plugin", 
                description: "",
                contract: freeContract(), 
                onTriggered: ({data}) => this.do(data) 
            })
        }

        do(data){
         }
    }
}








