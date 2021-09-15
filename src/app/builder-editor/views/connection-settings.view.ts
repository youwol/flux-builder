import { Adaptor, Connection, flattenSchemaWithValue, ModuleConfiguration, ModuleFlux, Property, Schema, uuidv4 } from "@youwol/flux-core"
import { VirtualDOM } from "@youwol/flux-view"
import { BehaviorSubject } from "rxjs"
import { filter } from "rxjs/operators"
import { AppStore } from "../builder-state"
import { AdaptorEditoView } from "./adaptor-editor.view"
import { AutoForm } from "./auto-form.view"


@Schema({
    pack: {}
})
export class ConnectionView{

    @Property({ 
        description: "wireless" 
    })
    readonly wireless : boolean = false

    @Property({ 
        description: "adaptor", 
        type:'code'
    })
    readonly adaptor : string = `
    return ({data,configuration,context}) => ({
        data: data,
        context:{},
        configuration: configuration
    })`

    constructor( params: { wireless?: boolean, adaptor?: string } = {}) {   
        Object.assign(this, params)
    }
}


let elementViewsFactory = (connection: Connection, appStore: AppStore) => [
    {
        test: (value: AutoForm.ValueDescription) => {
            return value.metadata && value.metadata.type == "code"
        },
        view: (value$: BehaviorSubject<string>) => {
            return {
                class: "fab fa-js-square fv-pointer fa-2x fv-hover-bg-background",
                onclick: () => {
                    AdaptorEditoView.popupModal({
                        connection,
                        initialCode: value$.getValue(),
                        appStore,
                        onUpdate: (content) => value$.next(content)
                    })
                }
            }
        }
    },
    ...AutoForm.viewFactory
]

export class ConnectionSettingsState{

    public readonly autoFormState : AutoForm.State
    public readonly initialSettings$ : BehaviorSubject<ConnectionView>

    constructor(
        connection: Connection, 
        public readonly appStore: AppStore
        ){
            
        let connectionViewData = appStore.getConnectionView( connection.connectionId)
        let data = new ConnectionView({
            ...(connectionViewData? {wireless:connectionViewData} : {}),
            ...(connection.adaptor? {adaptor:connection.adaptor.toString()} : {})
        })
        let schemaWithValue = flattenSchemaWithValue(data)
        Object.keys(schemaWithValue).forEach( k => schemaWithValue[k] = schemaWithValue[k][0])
        let configurationIn$ = new BehaviorSubject<Object>(data)

        this.autoFormState = new AutoForm.State(
            configurationIn$,
            schemaWithValue as any, 
            elementViewsFactory(connection, appStore)
            )
        
        this.initialSettings$ = new BehaviorSubject(data)

        this.autoFormState.currentValue$.pipe(
            filter( (value) => value['wireless'] != this.initialSettings$.getValue()['wireless'] )
        )
        .subscribe( (value: ConnectionView) => {
            this.initialSettings$.next(value)
            this.appStore.setConnectionView(connection, {wireless: value.wireless}, true)
            this.appStore.selectConnection(connection.connectionId)
        })
        this.autoFormState.currentValue$.pipe(
            filter( (value) => value['adaptor'] != this.initialSettings$.getValue()['adaptor'] )
        )
        .subscribe( (value: ConnectionView) => {
            this.initialSettings$.next(value)
            let adaptor = new Adaptor(uuidv4(), value.adaptor)
            appStore.addAdaptor(adaptor, connection)
            this.appStore.selectConnection(connection.connectionId)
        })
    }
}

export class ConnectionSettingsView implements VirtualDOM{

    public readonly class = "h-100 d-flex flex-column"
    public readonly children: VirtualDOM[]
    public readonly style = { fontSize:'smaller'}
    
    constructor( public readonly state: ConnectionSettingsState){

        this.children = [
            new AutoForm.View({state: state.autoFormState, class:'flex-grow-1 overflow-auto my-1', style:{'min-height':'0px'}} as any)
            ]
    }
}

