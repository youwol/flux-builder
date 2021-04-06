
import { DrawingArea } from '@youwol/flux-svg-plots';

import { AppStore,AppBuildViewObservables, AppObservables,AppDebugEnvironment} 
from '../builder-state/index';

import { getBoundingBox } from './drawing-utils';
import { ModulesPlotter } from './modules-plotter';

export class BoxSelectorPlotter{
    
    debugSingleton = AppDebugEnvironment.getInstance()
    
    start = undefined
    rect = undefined
    constructor( public readonly drawingArea : DrawingArea,
        public readonly plottersObservables: AppBuildViewObservables,
        public readonly appObservables: AppObservables,
        public readonly appStore : AppStore,
        public readonly modulesPlotter: ModulesPlotter){        
            
    }

    startSelection(coordinates){

        //this.appObservables.unselect$.next()
        coordinates = this.convert(coordinates)
        this.rect = this.drawingArea.drawingGroup
        .append("rect")
        .attr("class","rectangle-selector")
        .attr("x", coordinates[0])
        .attr("y", coordinates[1])
        .attr("height", 0)
        .attr("width", 0);

        this.start = coordinates
    }
    finishSelection(coordinates){
        
        this.start = undefined
        let modulesId = BoxSelectorPlotter.getSelectedModules(this.appStore.getActiveModulesView(), 
            this.drawingArea,this.rect)
        let finalRect = getBoundingBox(modulesId,10,this.drawingArea)

        this.rect/*.transition()
        .duration(500)
        .attr("x",finalRect.x)
        .attr("y",finalRect.y)
        .attr("width",finalRect.width)
        .attr("height",finalRect.height)*/
        .remove()
        this.appStore.select({
            modulesId:modulesId, 
            connectionsId:[]})
        //setTimeout(() => this.wfPlotter.setSelectionBox(modulesId), 500)
    }
    moveTo(coordinates){
        if( !this.start)
            return 
        coordinates = this.convert(coordinates)
        this.rect.attr("width", Math.max(0, coordinates[0] - +this.rect.attr("x")))
        .attr("height", Math.max(0, coordinates[1] - +this.rect.attr("y")));

        let highlighteds = BoxSelectorPlotter.getSelectedModules(this.appStore.getActiveModulesView(), 
            this.drawingArea,this.rect)
        this.modulesPlotter.highlight(highlighteds )
    }
    
    static getSelectedModules(modulesView,drawingArea, rect) : Array<String> {
        let coors = modulesView
        .map(m => [
            m.moduleId,
            drawingArea.hScale(m.xWorld), 
            drawingArea.vScale(m.yWorld)])

        let x0 = Number(rect.attr("x"))
        let y0 = Number(rect.attr("y"))
        let x1 = x0 + Number(rect.attr("width"))
        let y1 = y0 + Number(rect.attr("height"))
        return coors
        .filter( ([_,x,y]) =>  x > x0  &&  x < x1 && y > y0 &&  y < y1)
        .map( ([mid,x,y] :[string,number,number]) =>mid)
        
    }
    convert([x,y]) {
        let transform = this.drawingArea.overallTranform
       
        return [(x-transform.translateX)/transform.scale,(y-transform.translateY)/transform.scale]
    }
}