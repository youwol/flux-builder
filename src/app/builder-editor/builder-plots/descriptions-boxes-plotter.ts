
import { DescriptionBox } from '@youwol/flux-core';
import { DrawingArea, CrossPlot } from '@youwol/flux-svg-plots';

import { AppStore,AppBuildViewObservables, AppObservables,AppDebugEnvironment, 
    LogLevel} from '../builder-state/index';

import { getBoundingBox } from './drawing-utils';



function drawBoxes( 
    descriptionsBoxes : Array<DescriptionBox>, 
    drawingArea : DrawingArea, 
    appStore : AppStore ){
    
    const plotData = descriptionsBoxes.map( box => { 

        const rect = getBoundingBox(box.modulesId,10,drawingArea)
        const x = drawingArea.hScale.invert( rect.x  + rect.width/2)
        const y = drawingArea.vScale.invert( rect.y + rect.height/2)
        const selected = appStore.descriptionBoxSelected && 
                       appStore.descriptionBoxSelected.descriptionBoxId == box.descriptionBoxId
        return {
            x: x, 
            y: y,
            classes:["description-box"].concat(selected ? ["selected"] : []),
            attributes:{ descriptionBoxId : box.descriptionBoxId },
            id: box.descriptionBoxId,
            data:{descriptionBox:box,
                  boundingBox:rect }
    }})
    const plotter = new CrossPlot({ plotId:"descriptionsBoxPlotter",
                                  plotClasses:[],
                                  drawingArea: drawingArea,
                                  entities:plotData})

   
    plotter.defaultElementDisplay = (d) => {

        const g = document.createElementNS("http://www.w3.org/2000/svg", "g")

        const headerHeight = 25;
        const padding = 25;
        const width = d.data.boundingBox.width
        const height = d.data.boundingBox.height
        g.innerHTML = `
       <rect height="${height}" width="${width}" 
        class="description-box content"  x="${-width/2}" y="${-height/2}"
        filter="url(#shadow)" ></rect>
        <path d="M${-width/2},${headerHeight-padding-height/2} v${-(headerHeight-10)} q0,-10 10,-10 h${width-20} q10,0 10,10  v${headerHeight-10} z" 
                class="description-box mdle-color-fill header " />
        <path d="M${-width/2},${headerHeight-padding-height/2} v${-(headerHeight-10)} q0,-10 10,-10 h${width-20} q10,0 10,10  v${headerHeight-10} " 
                class="description-box header outline" />

        <text class="description-box title" x="${-width/2 + 10 }" y="${-height/2 - 5}" >${d.data.descriptionBox.title}</text>
        `
        return g
    }
    const drawnElements = plotter.draw(plotData)
    const format        = (d) => d.filter(g=>g).reduce( (acc,e)=>acc.concat(e),[]) 

    return drawnElements.entered._groups.concat(drawnElements.updated._groups).map( format ).reduce( (acc,e)=>acc.concat(e),[]) 
}


export class DescriptionsBoxesPlotter{

    debugSingleton = AppDebugEnvironment.getInstance()

    constructor( public readonly drawingArea : DrawingArea,
                 public readonly plottersObservables: AppBuildViewObservables,
                 public readonly appObservables: AppObservables,
                 public readonly appStore : AppStore){
        
        this.debugSingleton.debugOn &&
        this.debugSingleton.logWorkflowView( {  
            level : LogLevel.Info, 
            message: "create descriptions boxes plotter", 
            object: { drawingArea : drawingArea,
                      plottersObservables : plottersObservables}
        })
        /* This line is for ensuring that description box are plotted behind everything else :/
        *  as it ensures the svg drawing group element of description boxes is created first (at plotter creation, while other elements 
        *  'wait' to be loaded or manually created) 
        *  Need a better management of layer ordering  
        */
        drawBoxes([], this.drawingArea, this.appStore)

        this.appObservables.descriptionsBoxesUpdated$
        .subscribe( descriptionsBoxes=>{
            const svgElements = drawBoxes(descriptionsBoxes, this.drawingArea, this.appStore)
            this.connectUserInteractions(svgElements)
            this.plottersObservables.descriptionsBoxesDrawn$.next(svgElements)
        })
    }

    
    connectUserInteractions(svgElements){
        
        svgElements.forEach( (g : SVGElement)=> 
            g.onclick = (event:any) => this.appStore.selectDescriptionBox(g.id) 
        )        
    }

    
}