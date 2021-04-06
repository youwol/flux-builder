
import { BehaviorSubject, merge } from 'rxjs';

import { ModuleFlow, Connection,Schema, Property, AdaptorConfiguration, Adaptor,
    flattenSchemaWithValue, uuidv4} from '@youwol/flux-core';
import { toCssName } from '@youwol/flux-svg-plots';
import {render, attr$, child$} from '@youwol/flux-view'

import { AppObservables, AppStore } from './builder-state/index';
import { codeEditorModal} from './views/modals/code-editor/code-editor.view';
import { grapesButton } from './utils.view';

declare var _ : any

let connection = {
    schemas:{ConnectionView:{}}
}


@Schema({
    pack: connection,
    description: "Intersection from ray casting"
})
export class ConnectionView{

    @Property({ description: "wireless" })
    readonly wireless : boolean

    @Property({ description: "adaptor" , type:'code'})
    readonly adaptor : string


    constructor( wireless = false, adaptor : string = `
return ({data,configuration,context}) => ({
    data: data,
    context:{},
    configuration: configuration
})` ) {
        this.wireless   = wireless
        this.adaptor = adaptor
    }
}
  

function flattenPropertiesNative( schema : any, data:any, suffix: string , Factory:any ){

    let acc = {[suffix.slice(1)]:[schema,data] }
    if(schema && schema.extends && Factory){
        let props = flattenPropertiesNative(Factory.schemas[schema.extends], data, suffix, Factory)
        _.merge( acc ,props)
    }

    if(schema && schema.type && Factory && Factory.schemas && Factory.schemas[schema.type] ){
        let props =  flattenPropertiesNative(Factory.schemas[schema.type], data, suffix, Factory)
        _.merge( acc ,props)
    }

    if(schema && schema.attributes){
        let props =  Object.entries(schema.attributes).reduce( (acc:Object, [key,val] :[any,any]) => {
            return _.merge( acc , flattenPropertiesNative(val,data[key], `${suffix}.${key}`, Factory))}, {} )
        _.merge( acc ,props)
    }

    return Object.keys(acc)
    .filter(key =>  acc[key][0] )
    .reduce((obj:any, key:any) => { obj[key] = acc[key]; return obj;}, {});
}


function moduleControls(d : ModuleFlow, appStore : AppStore, panelDiv:HTMLDivElement ): [Array<any>, any]{

    let flattened = flattenSchemaWithValue(d.configuration.data)
    let titleDiv    = input("wf-config-title","wf-config-title","title","", [ {type:"string"}, d.configuration.title ])
    let controls    = Object.entries(flattened).slice(1)
    .map( ([k,v]:[any,any]) =>widgetsFactory( d, k, v, appStore) )
    .filter( (d:any) => d)

    let header = settingsHeader( 
        d.Factory.resources,
        d.configuration, 
        ({ title,description,data}) =>  
            appStore.updateModule(d,new d.Factory.Configuration( { title,description,data} )), panelDiv 
    )

    return [[titleDiv,...controls], header]
}

function connectionControls(d : Connection, appStore : AppStore, panelDiv:HTMLDivElement): [Array<any>, any]{
    
    let data        = appStore.getConnectionView( d.connectionId) || new ConnectionView()
    if(d.adaptor){
        data.adaptor = d.adaptor.configuration.data.code
    }
    let schema = 
      {
        "attributes": {
          "wireless": {
            "type": "Boolean",
            "name": "wireless",
            "metadata": {
              "description": "wireless"
            }
          },
          "adaptor": {
            "type": "String",
            "name": "adaptor",
            "metadata": {
              "description": "adaptor",
              "type": "code"
            }
          }
        },
        "methods": [],
        "extends": [
          ""
        ]
      }
    let flattened   = flattenPropertiesNative( schema, data, "", undefined )

    let controls    = Object.entries(flattened).slice(1)
    .map( ([k,v]:[any,any]) =>widgetsFactory( d, k, v, appStore) )
    .filter( (d:any) => d)


    let validationBtt = button( {data:data},( properties : any)=> {
        if(properties.data.adaptor){
            let adaptorConf = new AdaptorConfiguration("","",{code:properties.data.adaptor})
            let adaptor = new Adaptor(uuidv4(),adaptorConf)
            appStore.addAdaptor(adaptor, d)  
        }
        appStore.setConnectionView(d, properties.data) },panelDiv  )
    return [[...controls],validationBtt ]
}

export function createAttributesPanel(appStore: AppStore, appObservables: AppObservables) : DocumentFragment {

    merge(appObservables.moduleSelected$,appObservables.connectionSelected$).subscribe(
        (d:any) => {
            
            document.getElementById("attributes-panel").innerHTML=""
            let panelDiv    = document.getElementById("attributes-panel") as HTMLDivElement
            var container   = document.createDocumentFragment();
            let [attrControls, validationBtn] = d.moduleId?
                moduleControls(d as ModuleFlow,appStore,panelDiv) :
                connectionControls(d as Connection,appStore,panelDiv)
            // All but the validation button
            panelDiv.appendChild(validationBtn)
            attrControls.forEach( div => container.appendChild(div))
            panelDiv.appendChild(container)      
        }
    )
    appObservables.unselect$.subscribe( (_)=>{
        document.getElementById("attributes-panel").innerHTML=""
    })

    var container = document.createDocumentFragment();
    return container
    }

function widgetsFactory(mdle: any, key: any, value: any, appStore: AppStore) {
    
    if(key==="code" || (value[0] && value[0].metadata &&  value[0].metadata.type &&  value[0].metadata.type.includes("code") ) )
        return code(mdle, toCssName(key), "",key, key, value[1], value[0].metadata.type , appStore)

    if(value && value[0] && value[0].type && value[0].type.toLowerCase() =="boolean")
        return checkbox(mdle, toCssName(key), key,key,  value[1])

    if(value && value[0] && value[0].type && value[0].type.toLowerCase() =="string" && value[0].metadata &&  value[0].metadata.enum )
        return options( toCssName(key), "", key, value[0].metadata.enum, key, value)

    if(value && value[0] && value[0].type && value[0].type.toLowerCase() =="string")
        return input( toCssName(key), "",key, key, value)
    
    if(value && value[0] && value[0].type && value[0].type.toLowerCase() =="number")
        return input( toCssName(key), "",key, key, value)

    return undefined
}

function settingsHeader( 
    resources: {[key:string]: string},
    conf: any, 
    callback: any,  
    div: HTMLDivElement 
    ) : HTMLElement {

    let configData  = _.cloneDeep(conf.data)
    let applyBtn = grapesButton({
        title:"apply",  
        classes:'fas fa-check', 
        onclick: () => applySettings(conf, configData, callback,  div ) 
    })
    let resourceExpanded$ = new BehaviorSubject(false)
    
    let menuView = resources
        ? { 
            class:'w-100',
            style:{position:'absolute'},
            children: Object.entries(resources).map( ([name, url])=> {
                return grapesButton({
                    title: name,  
                    classes:"",
                    onclick: () => { window.open( url,'_blank'); resourceExpanded$.next(false)}
                }) 
            })
        }
        :{}

    let selectResource = {
        class: 'flex-grow-1',
        style:{position:'relative'},
        children: [
            {   class:'d-flex align-items-center gjs-pn-btn fv-text-focus',
                onclick: () => resourceExpanded$.next(!resourceExpanded$.getValue()),
                children:[
                    {
                        tag:'i',
                        class: attr$(
                            resourceExpanded$,
                            (expanded) => expanded ? 'fas fa-caret-down px-2' : 'fas fa-caret-right px-2'
                        )
                    },
                    {
                        tag:'i',
                        class:'fas fa-book-reader'
                    }
                ]
            },
            child$(
                resourceExpanded$,
                (expanded) => expanded ?  menuView : {}
            )
        ]
    }

    let view = {
        class: "d-flex align-items-center p-2",
        style: {position: 'sticky', top:'0px', 'z-index':5, 'background-color':"#444"},
        children:[
            applyBtn,
            resources ? selectResource : {}
        ]
    }
    return render(view)
}

function applySettings(conf: any, configData, callback: any,  div: HTMLDivElement ) {

    let titleDiv = div.querySelector("#wf-config-title input") as any
        let title = titleDiv ? titleDiv["value"] : undefined
        div.querySelectorAll(".wf-config-property").forEach( (inputDiv:any) => {
            
            let pathElems  = inputDiv.getAttribute("path").split('.')
            let lastRed    = pathElems.slice(0,-1).reduce( (acc:any,elem:any) => acc[elem], configData)
            lastRed[ pathElems.slice(-1)[0] ] = inputDiv.value || inputDiv.getAttribute("value")
            if(inputDiv.type=="number")
                lastRed[ pathElems.slice(-1)[0] ] = Number(lastRed[ pathElems.slice(-1)[0] ])

            if(inputDiv.type=="checkbox"){
                lastRed[ pathElems.slice(-1)[0] ] = inputDiv["checked"] 
            }
            if(inputDiv.type=="select-one"){
                let v = inputDiv['options'][inputDiv['selectedIndex']].value
                
                lastRed[ pathElems.slice(-1)[0] ] = v
            }

        })
        document.querySelectorAll("span.modified").forEach( elem => elem.classList.toggle("modified"))
        
        callback( { title,description:conf.description,data:configData})
}

function button( conf: any, callback: any,  div: HTMLDivElement ) : HTMLElement {

    let configData  = _.cloneDeep(conf.data)
    let bttDiv      = document.createElement("div") as HTMLDivElement
    bttDiv.style.position = 'sticky'
    bttDiv.style.top = "-5px"
    bttDiv.style.zIndex = "5"
    bttDiv.style.backgroundColor = "#444"

    bttDiv.onclick = () =>{
        applySettings(conf, configData, callback,  div )
    }
    bttDiv.innerHTML = `<span class="gjs-pn-btn gjs-pn-active fv-text-focus"> <i class="fas fa-check p-2 ">Apply settings</i></span>`
    return bttDiv
}

function input(id: string, classe: string, label: string, path: string, description: any ) : HTMLDivElement {
    let value = description[1]
    let type  = description[0]["type"]
    
    function option({ label, value }:{ label:any, value:any }) {
        return `<option value="${value}">${label}</option>`
    }
    let innerHtml=`
    <div id="${id}" class="gjs-sm-property gjs-sm-select gjs-sm-property__${classe}" style="display: block;">
      <div class="gjs-sm-label gjs-four-color">        
        <span class="gjs-sm-icon " title="">${label}</span>
        <b class="gjs-sm-clear" data-clear-style="" style="display: none;">⨯</b>    
      </div>
      <div class="gjs-fields">        
        <div class="gjs-field gjs-select">
            <input path="${path}" type="${type}" class="wf-config-property" placeholder="${value}" value="${value}">
        </div>
      </div>
    </div>
    `
    let div = document.createElement('div') as HTMLDivElement
    div.innerHTML = innerHtml
    return div
}

function checkbox(id: string, classe: string, label: string, path: string, value: any ) : HTMLDivElement {
    
    let innerHtml=`
    <div id="${id}" class="d-flex py-1 gjs-sm-property gjs-sm-select gjs-sm-property__${classe}" style="display: block;">
      <div class="gjs-sm-label gjs-four-color">    
        <span class="gjs-sm-icon " title="">${label}</span>
        <input type="checkbox" path="${path}" name="${label}" class="wf-config-property mx-2" placeholder="${value}" ${value?'checked':''} value="${value}">  
      </div>
    </div>
    `
    let div = document.createElement('div') as HTMLDivElement
    div.innerHTML = innerHtml
    return div
}

function options(id: string, classe: string, label: string, options: Array<string>, path: string, value: any ) : HTMLDivElement {
    
    let innerHtml=`
    <div id="${id}" class="gjs-sm-property gjs-sm-select gjs-sm-property__${classe}" style="display: block;">
      <div class="gjs-sm-label">
        
      
      <b class="gjs-sm-clear" data-clear-style="" style="display: none;">⨯</b>
      ${label}
      </div>
      <div class="gjs-fields">
        
      <div class="gjs-field gjs-select">
        <span id="gjs-sm-input-holder">
        <select class="wf-config-property" path="${path}" type="select-one">
        ` +
        options.map( option => option == value[1] ? `<option value="${option}" selected>${option} </option>` : `<option value="${option}">${option} </option>`) +
        `</select>
        <div class="gjs-sel-arrow">
          <div class="gjs-d-s-arrow"></div>
        </div>
      </div>
    
      </div>
    </div>
    `
    let div = document.createElement('div') as HTMLDivElement
    div.innerHTML = innerHtml
    return div
}



/*

export class ExternalCode extends Code {

    constructor( 
        public readonly ownerId: string,
        public readonly ownerName: string,
        public readonly content : string, 
        public readonly type: CodeType,
        public readonly metadata: any = {}) {
        super(content,type, metadata )
    }
}
*/
function code(
    selection: ModuleFlow | Connection, id: string, classe: string, label: string, path: string, value: string, 
    fullType: string , appStore: AppStore) : HTMLDivElement {

    let innerHtml=`
    <div id="${id}" class="gjs-sm-property gjs-sm-select gjs-sm-property__${classe}" style="display: block;">
      <div class="gjs-sm-label gjs-four-color">        
        <span class="gjs-sm-icon pr-2 wf-code-bttn-label wf-config-property" path="${path}" title="" >${label}</span> 
            <i class="fas fa-edit wf-code-bttn btn btn-secondary"></i>
        <b class="gjs-sm-clear" data-clear-style="" style="display: none;">⨯</b>    
      </div>
    </div>
    `
    let div       = document.createElement('div') as HTMLDivElement
    div.innerHTML = innerHtml
    let bttn      = div.querySelector(".wf-code-bttn") as HTMLDivElement
    let labelDiv  = div.querySelector(".wf-code-bttn-label") as HTMLDivElement
    labelDiv.setAttribute("value",value)

    let onUpdateMdle = (content) => {
        let pathElems = path.split('/')
        let mdle = selection as ModuleFlow
        let lastRed = pathElems
        .slice(0,-1)
        .reduce( (acc:any,elem:any) => acc[elem], mdle.configuration.data)
        lastRed[ pathElems.slice(-1)[0] ] = content
        console.log(mdle.configuration)
        appStore.updateModule(
            mdle, 
            mdle.configuration
        ) 
    }
    let onUpdateAdaptor = (content) => {
        let adaptorConf = new AdaptorConfiguration("","",{code:content})
        let adaptor = new Adaptor(uuidv4(),adaptorConf)
        appStore.addAdaptor(adaptor, selection as Connection)  
    }

    bttn.onclick =() =>{   
        codeEditorModal(selection, value, selection instanceof(ModuleFlow) ? onUpdateMdle : onUpdateAdaptor, appStore)
    } 
    return div
}

/*
function select(id: string, classe: string, label: string,  options: Array<{ label, value }>) : HTMLDivElement {

    function option({ label, value }) {
        return `<option value="${value}">${label}</option>`
    }
    let innerHtml=`
    <div id="${id}" class="gjs-sm-property gjs-sm-select gjs-sm-property__${classe}" style="display: block;">
      <div class="gjs-sm-label gjs-four-color">        
        <span class="gjs-sm-icon " title="">
            ${label}
        </span>
      <b class="gjs-sm-clear" data-clear-style="" style="display: none;">⨯</b>
    
      </div>
      <div class="gjs-fields">        
        <div class="gjs-field gjs-select">
            <span id="gjs-sm-input-holder">
                <select> ${ options.reduce((acc, e) => acc + option(e), "")} </select>
            </span>
            <div class="gjs-sel-arrow">
            <div class="gjs-d-s-arrow"></div>
            </div>
        </div>
      </div>
    </div>
    `
    let div = document.createElement('div') as HTMLDivElement
    div.innerHTML = innerHtml
    return div
}


function colorPicker(id : string, classe: string, label: string, defaultColor: string ) : HTMLDivElement{

    let innerHtml = `
    <div id="${id}" class="gjs-sm-property gjs-sm-color gjs-sm-property__${classe}" style="display: block;">
        <div class="gjs-sm-label gjs-four-color">            
            <span class="gjs-sm-icon " title="">
                ${label}
            </span>
            <b class="gjs-sm-clear" data-clear-style="" style="display: none;">⨯</b>
            
        </div>
        <div class="gjs-fields">
                
            <div class="gjs-field gjs-field-color">
            <div class="gjs-input-holder"><input type="text" placeholder="none"></div>
            <div class="gjs-field-colorp">
                <div class="gjs-field-colorp-c" data-colorp-c="">
                <div class="gjs-checker-bg"></div>
                <div class="gjs-field-color-picker" style="background-color: ${defaultColor};"></div></div>
            </div>
            </div>
        </div>
    </div>
    `
    let div = document.createElement('div') as HTMLDivElement
    div.innerHTML = innerHtml
    return div
}

function intInput(id : string, classe: string, label: string, defaultValue: number ) : HTMLDivElement{

    let innerHtml = `
    <div id="${id}" class="gjs-sm-property gjs-sm-integer gjs-sm-property__${classe}" style="display: block;">
        <div class="gjs-sm-label">  
            <span class="gjs-sm-icon " title="">
            ${label}
            </span>
        </div>
        <div class="gjs-fields">  
            <div class="gjs-field gjs-field-integer">
                <span class="gjs-input-holder"><input type="text" placeholder="${defaultValue}"></span>
                <span class="gjs-field-units"></span>
                <div class="gjs-field-arrows" data-arrows="">
                    <div class="gjs-field-arrow-u" data-arrow-up=""></div>
                    <div class="gjs-field-arrow-d" data-arrow-down=""></div>
                </div>
            </div>
        </div>
    </div>`
    
    let div = document.createElement('div') as HTMLDivElement
    div.innerHTML = innerHtml
    return div
}
*/