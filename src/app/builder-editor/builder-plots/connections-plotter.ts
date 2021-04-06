
import { Subject, combineLatest } from "rxjs";
import * as operators from "rxjs/operators";
import { ModuleFlow, Connection, GroupModules, createHTMLElement} from '@youwol/flux-core';
import { DrawingArea,LinkPlot,toCssName } from '@youwol/flux-svg-plots';

import { PlotterConnectionEntity } from "./models-view";
import { AppStore,AppBuildViewObservables, AppObservables,AppDebugEnvironment, 
    LogLevel}  from '../builder-state/index';

let wirelessIcon = `
<linearGradient id="a" gradientTransform="matrix(1 0 0 -1 0 -22278)" gradientUnits="userSpaceOnUse" x1="0" x2="512" y1="-22534" y2="-22534"><stop offset="0" stop-color="#00f1ff"/><stop offset=".231" stop-color="#00d8ff"/><stop offset=".5138" stop-color="#00c0ff"/><stop offset=".7773" stop-color="#00b2ff"/><stop offset="1" stop-color="#00adff"/></linearGradient>
<path d="m512 256c0 141.386719-114.613281 256-256 256s-256-114.613281-256-256 114.613281-256 256-256 256 114.613281 256 256zm0 0" fill="url(#a)"/><g fill="#fff"><path d="m279.050781 385.15625c0 13.128906-10.640625 23.773438-23.769531 23.773438s-23.773438-10.644532-23.773438-23.773438 10.644532-23.769531 23.773438-23.769531 23.769531 10.640625 23.769531 23.769531zm0 0"/><path d="m85.996094 209.265625c-3.660156 0-7.332032-1.332031-10.222656-4.027344-6.058594-5.644531-6.394532-15.136719-.746094-21.199219 47.460937-50.921874 111.730468-78.964843 180.96875-78.964843 69.246094 0 133.515625 28.042969 180.976562 78.964843 5.648438 6.0625 5.3125 15.554688-.746094 21.199219-6.058593 5.652344-15.550781 5.316407-21.199218-.742187-41.726563-44.769532-98.203125-69.421875-159.023438-69.421875-60.832031 0-117.304687 24.652343-159.03125 69.421875-2.953125 3.167968-6.960937 4.769531-10.976562 4.769531zm0 0"/><path d="m138.582031 269.089844c-3.820312 0-7.640625-1.449219-10.566406-4.355469-5.878906-5.832031-5.914063-15.332031-.082031-21.210937 35.101562-35.375 80.582031-54.859376 128.0625-54.859376 47.472656 0 92.953125 19.480469 128.0625 54.859376 5.835937 5.878906 5.800781 15.375-.078125 21.210937-5.882813 5.835937-15.378907 5.800781-21.214844-.078125-29.433594-29.660156-67.351563-45.992188-106.769531-45.992188-39.421875 0-77.339844 16.332032-106.765625 45.988282-2.933594 2.957031-6.789063 4.4375-10.648438 4.4375zm0 0"/><path d="m315.84375 328.84375c-3.816406 0-7.632812-1.445312-10.558594-4.34375-13.234375-13.113281-32.636718-21.589844-49.421875-21.589844-.003906 0-.003906 0-.007812 0h-1.039063c-.003906 0-.007812 0-.007812 0-16.789063 0-36.1875 8.472656-49.425782 21.589844-5.882812 5.828125-15.378906 5.785156-21.210937-.097656-5.832031-5.886719-5.789063-15.382813.097656-21.214844 18.847657-18.675781 45.875-30.277344 70.535157-30.277344h.011718 1.039063.011719c24.660156 0 51.683593 11.601563 70.535156 30.277344 5.882812 5.832031 5.929687 15.328125.097656 21.214844-2.933594 2.957031-6.796875 4.441406-10.65625 4.441406zm0 0"/></g>
`
let svgAdaptorGroup = {
    tag: "g", class:'adaptor', attributes:{},
    style:{visibility:'visible'},
    children:[
        {tag:'path', attributes: {d:"M211.331,190.817c-1.885-1.885-4.396-2.922-7.071-2.922c-2.675,0-5.186,1.038-7.07,2.922l-32.129,32.129l-24.403-24.403   l32.129-32.129c3.897-3.899,3.897-10.243-0.001-14.142l-11.125-11.125c-1.885-1.885-4.396-2.922-7.071-2.922   c-2.675,0-5.187,1.038-7.07,2.923l-32.128,32.128l-18.256-18.256c-1.885-1.885-4.396-2.922-7.071-2.922   c-2.675,0-5.186,1.038-7.07,2.922L66.95,171.062c-3.899,3.899-3.899,10.243,0,14.143l3.802,3.802   c-1.596,1.086-3.103,2.325-4.496,3.718l-46.679,46.679c-5.836,5.835-9.049,13.62-9.049,21.92c0,8.301,3.214,16.086,9.049,21.92   l17.943,17.943L5.126,333.582c-6.835,6.835-6.835,17.915,0,24.749c3.417,3.417,7.896,5.125,12.374,5.125s8.957-1.708,12.374-5.125   l32.395-32.395l18.091,18.091c5.834,5.835,13.619,9.048,21.92,9.048s16.086-3.213,21.92-9.048l46.679-46.679   c1.394-1.393,2.633-2.901,3.719-4.497l3.802,3.802c1.885,1.885,4.396,2.923,7.07,2.923c2.675,0,5.186-1.038,7.072-2.923   l16.04-16.042c1.887-1.885,2.925-4.396,2.925-7.072c0-2.676-1.038-5.187-2.924-7.071l-18.255-18.255l32.129-32.129   c3.898-3.899,3.898-10.244-0.001-14.142L211.331,190.817z" }},
        {tag:'path', attributes: {d:"M358.33,5.126c-6.834-6.834-17.914-6.834-24.748,0l-32.686,32.686l-17.944-17.944c-5.834-5.835-13.619-9.048-21.92-9.048   c-8.301,0-16.086,3.213-21.92,9.048l-46.679,46.679c-1.393,1.393-2.632,2.9-3.719,4.497l-3.802-3.802   c-1.885-1.885-4.396-2.923-7.071-2.923c-2.675,0-5.187,1.038-7.071,2.923l-16.042,16.042c-1.886,1.885-2.924,4.396-2.924,7.072   c0,2.675,1.038,5.187,2.924,7.071l111.447,111.448c1.885,1.885,4.396,2.923,7.071,2.923c2.676,0,5.186-1.038,7.071-2.923   l16.043-16.043c3.899-3.899,3.899-10.243,0-14.142l-3.801-3.801c1.596-1.086,3.103-2.325,4.496-3.719l46.679-46.679   c5.835-5.834,9.049-13.62,9.049-21.92s-3.213-16.086-9.049-21.92l-18.09-18.09l32.686-32.686   C365.165,23.04,365.165,11.96,358.33,5.126z" }}
    ],
}

function connectionDisplay(d) {
    
    if(!d.data.adaptor){
        let data = {
            tag: "g", attributes:{ x1:d.x1, y1:d.y1, x2:d.x2, y2:d.y2 },
            children: {
                connection: { tag: "path", class: "connection-path", attributes: { d:`M${d.x1},${d.y1} C${0.5*(d.x1+d.x2)},${d.y1} ${0.5*(d.x1+d.x2)},${d.y2} ${d.x2},${d.y2}` }},
            }
        }
        return createHTMLElement({ data, namespace: "svg" }) 
    }
    let norm  = Math.pow( (d.x2-d.x1)*(d.x2-d.x1) + (d.y2-d.y1)*(d.y2-d.y1) , 0.5)
    let cos_a = (d.x1-d.x2)/ norm
    let sin_a = (d.y1-d.y2)/ norm
    let angle = ( -1 + 2*Number(d.y2<d.y1))*Math.acos( (d.x1-d.x2)/ norm ) * 180 /3.14
    let x1 = d.x1 - 50* cos_a
    let y1 = d.y1- 50* sin_a
    let gAdaptor = svgAdaptorGroup
    gAdaptor.attributes = { transform:`translate(${-(d.x2-d.x1)/2 - 50* cos_a },${-(d.y2-d.y1)/2  - 50* sin_a } ) rotate(${angle+45})  translate(-0,-36) scale(0.1)` }
    let data = {
        tag: "g", attributes:{ x1:x1, y1:y1, x2:d.x2, y2:d.y2 },
        children: {
            connection: { tag: "path", class: "connection-path", attributes: { d:`M${d.x2},${d.y2} C${0.5*(x1+d.x2)},${d.y2} ${0.5*(x1+d.x2)},${0.5*(y1+d.y2)} ${x1},${y1}`, x1:x1, y1:y1, x2:d.x2, y2:d.y2 }},
            adaptor: gAdaptor,
        }
    }    
    return createHTMLElement({ data, namespace: "svg" }) 
}

function getConnectionId(c : Connection) : string {
    return c.connectionId
}
function retrieveSvgContainerGroup(moduleId, modulesGroup, appStore){
    // when connection is between 2 different layers, the slot to connect with is included in the 'groupModule' 
    // that contains 'moduleId'
    let svgGroup = modulesGroup[moduleId] 
    if(svgGroup)
        return svgGroup
    let container = appStore.getParentGroupModule(moduleId)
    return container ? modulesGroup[container.moduleId] : undefined
}

function toPlotterConnectionEntity(c : Connection, modulesGroup : Object, appStore :AppStore) : PlotterConnectionEntity {
    let props = appStore.project.builderRendering.connectionsView.find(cView => cView.connectionId == c.connectionId)
    return new PlotterConnectionEntity(
        getConnectionId(c) ,
        ["connection", "mdle-color-stroke", toCssName(appStore.getModule(c.start.moduleId).Factory.uid) ].concat(props&&props.wireless? ["wireless"]: []), 
        retrieveSvgContainerGroup(c.end.moduleId,modulesGroup,appStore), 
        retrieveSvgContainerGroup(c.start.moduleId,modulesGroup,appStore), 
        c,
        c.adaptor)
}

function drawWirelessSlots( drawingArea: DrawingArea, appStore: AppStore){
    let wirelesses   = drawingArea.svgCanvas.node().querySelectorAll(".wireless")
    let drawingGroup = drawingArea.drawingGroup.node()
    let gPlugs       = drawingGroup.querySelector("#wireless-slots")
    if(gPlugs)
        gPlugs.remove()
    gPlugs      = document.createElementNS("http://www.w3.org/2000/svg", "g")
    gPlugs.id   = "wireless-slots"
    drawingGroup.appendChild(gPlugs)
    
    wirelesses.forEach( g => {
        let selectFct =  (event) => {
            event.stopPropagation()
            appStore.selectConnection(appStore.getConnection(g.id)) 
        }
        let delta = 25        
        let x1 = Number(g.getAttribute("x1"));let y1 = Number(g.getAttribute("y1"))
        let x2 = Number(g.getAttribute("x2"));let y2 = Number(g.getAttribute("y2"))  
        
        const gplugStart = document.createElementNS("http://www.w3.org/2000/svg", "g")
        const gplugEnd   = document.createElementNS("http://www.w3.org/2000/svg", "g")
        gplugStart.setAttribute("transform" , g.getAttribute("transform")  )
        gplugEnd.setAttribute("transform" , g.getAttribute("transform")  )
        gplugStart.innerHTML=`<line class='' x1="${x1}" y1="${y1}" x2="${Number(x1)-50}" y2="${y1}"></line><g transform="translate(${x1-50-2*delta},${y1-delta}) scale(0.1)" > ${wirelessIcon}</g>`
        gplugEnd.innerHTML  =`<line class='' x1="${x2}" y1="${y2}" x2="${x2+50}" y2="${y2}"></line><g transform="translate(${x2+50},${y2-delta}) scale(0.1)" > ${wirelessIcon}</g>`
        gplugStart.onclick = selectFct
        gplugEnd.onclick =  selectFct
        gPlugs.appendChild(gplugStart)
        gPlugs.appendChild(gplugEnd)
    })
}

function drawConnections(connections , modulesGroup, drawingArea : DrawingArea, plotObservables$, appStore : AppStore){
    
    let connectionsPlotData = connections.map( c =>  toPlotterConnectionEntity(c,modulesGroup,appStore ) )
    let plot = new LinkPlot( 
        {   plotId:"connectionsPlot",
            plotClasses:[],
            drawingArea: drawingArea,
            orderIndex:3 }) 
    plot.defaultElementDisplay = connectionDisplay as any
    plot.draw(connectionsPlotData)
    plot.entities$.subscribe( d=> plotObservables$.next(d) ) 

    drawWirelessSlots(drawingArea, appStore) 
    return undefined
}

function getSlot(mdle: ModuleFlow, domPlugElement, plugType){

    let slotId = domPlugElement.getAttribute("slotId") || domPlugElement.getAttribute("slotid")
    let slot = mdle.getSlot( slotId )
    if( slot)
        return slot
    if( mdle instanceof GroupModules.Module && slotId){
        // we end up here in case of slot corresponding to an implicit input of a group
        let moduleId = domPlugElement.getAttribute("moduleId") || domPlugElement.getAttribute("moduleid")
        return mdle.getAllChildren() .find( mdle => mdle.moduleId == moduleId).getSlot(slotId)
    }
    console.warn("The builder plot should define the attribute 'slotId' of the slots elements",domPlugElement)
    // This section is for backward compatibility 06/15/2020
    slot = (plugType === "input" ) ?
    mdle.inputSlots.find(
        slot => domPlugElement.id === "input-slot_"+slot.slotId+"_"+slot.moduleId):
    mdle.outputSlots.find(
        slot => domPlugElement.id === "output-slot_"+slot.slotId+"_"+slot.moduleId)
        
    return slot
}

function getMdlWithGroup(plugSvgElement:SVGElement, appStore: AppStore) : [ModuleFlow, HTMLElement]{
    
    let containerSlot = plugSvgElement.parentElement
    let mdl = appStore.getModuleOrPlugin(containerSlot.getAttribute("moduleId") || containerSlot.getAttribute("id")) 
    if(!mdl){
        containerSlot = containerSlot.parentElement
        mdl = appStore.getModuleOrPlugin(containerSlot.getAttribute("moduleId") || containerSlot.getAttribute("id"))
    }
    return [mdl,containerSlot]
}

class DrawingConnection{
    xOrigin = undefined
    yOrigin = undefined
    slot = undefined
    constructor(public mdle, public domModuleElement,
        public domPlugElement, public plugType, public isDrawing, public isStarted ){
        
        this.xOrigin=Number(domModuleElement.getAttribute("x")) + Number(domPlugElement.getAttribute("cx")),
        this.yOrigin=Number(domModuleElement.getAttribute("y")) + Number(domPlugElement.getAttribute("cy"))
        
        this.slot = getSlot(mdle,domPlugElement ,plugType )
    }
}


export class ConnectionsPlotter{

    public readonly debugSingleton = AppDebugEnvironment.getInstance()
    public readonly connectionPlots   : LinkPlot = undefined

    drawingConnection : DrawingConnection = undefined
    // we don't want to create connection just after on finished, this is the purpose of this 
    // there should be better way to do using rxjs
    connectionCreationEnabled: boolean = true

    constructor( public readonly drawingArea : DrawingArea,
                 public readonly plottersObservables: AppBuildViewObservables,
                 public readonly appObservables: AppObservables,
                 public readonly appStore : AppStore){

        let plotObservables$ = new Subject<any>()
        
        this.connectUserInteractions(plotObservables$)

        this.debugSingleton.debugOn &&
        this.debugSingleton.logWorkflowView( {  
            level : LogLevel.Info, 
            message: "create connections plotter", 
            object: { drawingArea : drawingArea,
                      plottersObservables : plottersObservables}
        })

        combineLatest( 
            this.appObservables.connectionsUpdated$,
            this.plottersObservables.modulesDrawn$
        ).subscribe( ([connections,modulesGroup])=>{
            this.debugSingleton.debugOn &&
            this.debugSingleton.logWorkflowView( {  
                level : LogLevel.Info, 
                message: "connections updated", 
                object: { connections : connections,
                    modulesGroup : modulesGroup}
            })
            drawConnections(appStore.project.workflow.connections,
                             modulesGroup,this.drawingArea, plotObservables$ ,appStore)
            this.plottersObservables.connectionsDrawn$.next()
        })

        let startConnectionSubscription = (obs$,type) => {
            obs$.pipe(
                operators.filter( _ => this.drawingConnection == undefined && this.connectionCreationEnabled )
            ).subscribe((d: any) =>{
                    let [mdl, mdlGroup] = getMdlWithGroup(d.event.target, appStore)
                    this.drawingConnection = new DrawingConnection(mdl,mdlGroup,d.event.target, type, true,false)
                }
            )
        }
        let endConnectionSubscription = (obs$,type) => {
            obs$.pipe(
                operators.filter( _ => this.drawingConnection != undefined &&
                                       this.drawingConnection.plugType == (type == "input" ? "output": "input") ),
            ).subscribe(
                (d: any) =>{ 
                    let [mdl, _] = getMdlWithGroup(d.event.target, appStore)
                    let connection = type=="input" ? 
                        new Connection( this.drawingConnection.slot, getSlot(mdl,d.event.target , "input" ) ) :
                        new Connection( getSlot(mdl,d.event.target , "output" ), this.drawingConnection.slot ) 
                    this.appStore.addConnection(connection) 
                    this.connectionCreationEnabled=false
                    setTimeout( () => this.connectionCreationEnabled=true, 500)
                }
            )
        }
        startConnectionSubscription(this.plottersObservables.plugInputClicked$,"input")
        startConnectionSubscription(this.plottersObservables.plugOutputClicked$,"output")
        endConnectionSubscription(this.plottersObservables.plugInputClicked$,"input")
        endConnectionSubscription(this.plottersObservables.plugOutputClicked$,"output")
        
        
        this.plottersObservables.mouseMoved$.pipe(
            operators.filter( _ => this.drawingConnection !== undefined )
        ).subscribe( (coordinates) => this.plotDrawingConnection(this.drawingConnection , coordinates ))
        
        this.appObservables.connectionSelected$.subscribe(
            c =>document.getElementById(getConnectionId(c)).classList.toggle("selected")
        )

        this.appObservables.unselect$.subscribe( () =>{ 
            let connection = document.getElementById("drawing-connection")
            if(connection)
                connection.remove()
            this.drawingConnection = undefined 
        })
    }

    plotDrawingConnection(drawingConnection, coordinates ){

        drawingConnection.isStarted = true   
        let coors= [ (coordinates[0]-1 - this.drawingArea.overallTranform.translateX)/ this.drawingArea.overallTranform.scale,
                    (coordinates[1]-1 - this.drawingArea.overallTranform.translateY)/ this.drawingArea.overallTranform.scale] 
        let selection = this.drawingArea.drawingGroup.selectAll(".drawing-connection")
        .data([{ 
            data : drawingConnection.data, 
            htmlPlug:drawingConnection.domElement 
        }])
        selection.exit().remove()
        selection.attr( "x2", coors[0])
        selection.attr( "y2",coors[1])
        selection.enter().append("line")
        .attr("id" , "drawing-connection")
        .attr("class" , "drawing-connection")
        .attr( "x1", drawingConnection.xOrigin)
        .attr( "y1",drawingConnection.yOrigin)
        .attr( "x2", coors[0])
        .attr( "y2",coors[1])
        console.log('coors:',coordinates[1], coors[1])
    }

    
    connectUserInteractions(plotObservables$){
        
        let click$ = plotObservables$.pipe(
            operators.filter( (d:any) => d.action==="click")
        )
        click$.subscribe( (d:any) => this.appStore.selectConnection(d.data.data) )
    }
    
}