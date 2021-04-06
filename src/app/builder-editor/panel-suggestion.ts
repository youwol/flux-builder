import { DrawingArea } from '@youwol/flux-svg-plots';
import { Connection } from '@youwol/flux-core';
import { AppStore } from './builder-state/index';

declare var _ : any

export function createPart(title: string, classes) {

    let block = document.createElement("div") as HTMLDivElement
    let titleDiv = document.createElement("div") as HTMLDivElement
    let icon = document.createElement("i") as HTMLDivElement
    let blockC = document.createElement("div") as HTMLDivElement

    blockC.classList.add("gjs-blocks-c", "d-none", ...classes)
    titleDiv.classList.add("gjs-title")
    block.classList.add("gjs-block-category", "gjs-open")
    icon.classList.add("gjs-caret-icon", "fa", "fa-caret-right")

    titleDiv.onclick = (event) => {
        
        let elem = titleDiv.firstChild as Element
        if (blockC.classList.contains("d-flex")) {
            blockC.classList.remove("d-flex")
            blockC.classList.add("d-none")
            elem.classList.remove("fa-caret-down")
            elem.classList.add("fa-caret-right")
        }
        else {
            blockC.classList.remove("d-none")
            blockC.classList.add("d-flex")
            elem.classList.remove("fa-caret-right")
            elem.classList.add("fa-caret-down")
            scaleSvgIcons(blockC)
        }
    }
    titleDiv.appendChild(icon)
    titleDiv.innerHTML += title
    block.appendChild(titleDiv)
    block.appendChild(blockC)
    return block

}
function createModuleDiv( moduleFactory, drawingArea) {

    let moduleDiv = document.createElement("div") as HTMLDivElement
    moduleDiv.classList.add("gjs-block", "gjs-one-bg", "gjs-four-color-h")
    let labelDiv = document.createElement("div") as HTMLDivElement
    labelDiv.classList.add("gjs-block-label")
    labelDiv.innerText = moduleFactory.displayName

    let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100px");
    svg.setAttribute("height", "70px");
    let item = new moduleFactory.ModuleRendererBuild().icon()

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g")
    g.id = moduleFactory.id
    g.classList.add("group-target")
    g.innerHTML = item.content
    g.style.stroke = "currentColor"
    svg.appendChild(g)
    moduleDiv.appendChild(labelDiv)
    moduleDiv.append(svg)
    return moduleDiv
}

function addDragingAbility(mdleFromId : string, direction, moduleDiv, moduleFactory, packId, drawingArea , appStore : AppStore){

    moduleDiv.draggable = true

    moduleDiv.ondragstart = (ev) => {
        ev.dataTransfer.setData("text/plain", moduleFactory.id);
        ev.dataTransfer.dropEffect = "copy";
    }
    moduleDiv.ondragend = (ev) => {

        let mdleFrom = appStore.getModule(mdleFromId)
        let scale    = drawingArea.overallTranform["scale"]
        let x0       = (ev.x - drawingArea.overallTranform.translateX) / scale
        let y0       = (ev.y - 50 - drawingArea.overallTranform.translateY) / scale
        let x        = drawingArea.hScale.invert(x0)
        let y        = drawingArea.vScale.invert(y0)
        let m1       = appStore.addModule( moduleFactory, [x, y])

        if( direction=="down" &&  m1.inputSlots.length==1 && mdleFrom.outputSlots.length==1){
            let c = new Connection( mdleFrom.outputSlots[0], m1.inputSlots[0])
            appStore.addConnection(c)
        }
        if( direction=="up" &&  mdleFrom.inputSlots.length==1 && m1.outputSlots.length==1){
            let c = new Connection( m1.outputSlots[0] , mdleFrom.inputSlots[0])
            appStore.addConnection(c)
        }

        appStore.selectModule(m1.moduleId)
    }

}
export function createSuggestionsPanel(appStore: AppStore, drawingArea: DrawingArea, suggestions$) {

    suggestions$.subscribe(([mdleFrom,associations]) => {

        let modulesFactory = appStore.getModulesFactory()
        let container = document.getElementById("suggestions-panel")
        container.innerHTML = ""

        var fragment = document.createDocumentFragment();
        let connectionDown = createPart("down stream", [])
        let connectionUp = createPart("up stream", [])

        fragment.appendChild(connectionDown)
        fragment.appendChild(connectionUp)
        container.appendChild(fragment)
        let startDict = associations.starts.reduce( (acc,start)=>_.merge(acc,{[start.factoryId]:start}) , {})
        Object.values(startDict).forEach((start:any) => {
            let moduleDiv = createModuleDiv(modulesFactory[start.factoryId],drawingArea) 
            addDragingAbility(mdleFrom.moduleId,"up", moduleDiv,modulesFactory[start.factoryId],start.packId, drawingArea,appStore)
            connectionUp.children[1].appendChild(moduleDiv)
        })

        let endDict = associations.ends.reduce( (acc,end)=>_.merge(acc,{[end.factoryId]:end}) , {})
        Object.values(endDict).forEach((end:any) => {
            let moduleDiv = createModuleDiv(modulesFactory[end.factoryId],drawingArea) 
            addDragingAbility(mdleFrom.moduleId, "down", moduleDiv,modulesFactory[end.factoryId],end.packId,drawingArea,appStore)
            connectionDown.children[1].appendChild(moduleDiv)
        })
    })
    var container = document.createDocumentFragment();
    return container    
}

function scaleSvgIcons( dom: HTMLDivElement) {

    dom.querySelectorAll(".group-target").forEach((g: HTMLElement) => {
        if (g.style.transform)
            return
        let parentBRect = g.parentElement.getBoundingClientRect()
        let bRect = g.getBoundingClientRect()
        let ty = parentBRect.top - bRect.top
        let tx = parentBRect.left - bRect.left
        let scale = Math.min(parentBRect.width / bRect.width, parentBRect.height / bRect.height)
        g.style.transform = `translate(${parentBRect.width / 4}px,${parentBRect.height / 4}px) scale(${0.5 * scale}) translate(${tx}px,${ty}px)`;
    })
}
