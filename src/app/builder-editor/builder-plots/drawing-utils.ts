import { DrawingArea } from '@youwol/flux-svg-plots';

import { filter, map } from 'rxjs/operators';
import { AppStore } from '../builder-state/index';
import { Observable } from 'rxjs';
import { GroupModules } from '@youwol/flux-core';


export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function convert(bbox, matrix, drawingArea) {
  var offset = document.getElementById(drawingArea.svgCanvas.attr("id")).getBoundingClientRect();
  const transform = drawingArea.overallTranform
  const a = {
    xmin: ((matrix.a * bbox.x) + (matrix.c * bbox.y) + matrix.e - offset.left
      - transform.translateX) / transform.scale,
    ymin: ((matrix.b * bbox.x) + (matrix.d * bbox.y) + matrix.f - offset.top
      - transform.translateY) / transform.scale,
    xmax: ((matrix.a * (bbox.x + bbox.width)) + (matrix.c * (bbox.y + bbox.height)) + matrix.e - offset.left
      - transform.translateX) / transform.scale,
    ymax: ((matrix.b * (bbox.x + bbox.width)) + (matrix.d * (bbox.y + bbox.height)) + matrix.f - offset.top
      - transform.translateY) / transform.scale
  }
  return a
}

export function getBoundingBox(modulesId: Array<String>, margin: number, drawingArea) {

  const bbox = modulesId
    .map((mid: string) => document.getElementById(mid))
    .filter(e => e)
    .map((e: any) => {
      /* in case the method getBBox does not exist on the svg element (e.g. during unit test - seems like
       * the proxy do not implement it), we return the x,y attributes of the <g> element (which identify to 
       * the center of the graphic element)
       */
      return e.getBBox ?
        convert(e.getBBox(), e.getScreenCTM(), drawingArea) :
        { xmin: e.getAttribute("x"), xmax: e.getAttribute("x"), ymin: e.getAttribute("y"), ymax: e.getAttribute("y") }
    })
    .reduce((acc, e) => ({
      xmin: Math.min(acc.xmin, e.xmin), xmax: Math.max(acc.xmax, e.xmax),
      ymin: Math.min(acc.ymin, e.ymin), ymax: Math.max(acc.ymax, e.ymax)
    }), { xmin: 1e6, xmax: -1e6, ymin: 1e6, ymax: 1e-6 })

  return {
    x: bbox.xmin - margin,
    y: bbox.ymin - margin,
    width: bbox.xmax - bbox.xmin + 2 * margin,
    height: bbox.ymax - bbox.ymin + 2 * margin
  }
}


export function focusElement(drawingArea: DrawingArea, svgElement: SVGElement) {

  const boudingBox = svgElement.getBoundingClientRect()
  drawingArea.lookAt(0.5*(boudingBox.left + boudingBox.right), 0.5*(boudingBox.top + boudingBox.bottom))
}


function mapToFocusCoordinate(activeLayerUpdated$ : Observable<{fromLayerId:string,toLayerId:string}>, appStore: AppStore) {

  return activeLayerUpdated$.pipe(
    //tap( ({fromLayerId, toLayerId}) => console.log({fromLayerId, toLayerId}) ),
    filter( ({fromLayerId, toLayerId}) => fromLayerId!=undefined &&  toLayerId!=undefined ),
    map( ({fromLayerId, toLayerId}) => ({
      fromLayer: appStore.getGroup(fromLayerId),
      toLayer: appStore.getGroup(toLayerId)
    })),
    map( ({fromLayer, toLayer}) =>{ 
        // if zoom-in
        if( fromLayer.getAllChildren(appStore.project.workflow).includes(toLayer))
            {return document.getElementById("expanded_"+toLayer.moduleId)}    
        
        // if zoom-out
        if( toLayer.getAllChildren(appStore.project.workflow).includes(fromLayer)){
            const targetLayer = toLayer.getDirectChildren(appStore.project.workflow)
            .find( layer => layer instanceof GroupModules.Module && (layer==fromLayer || layer.getModuleIds().includes(fromLayer.moduleId)) )
            return document.getElementById(targetLayer.moduleId)  
        }
        // if zoom from/to different branches of layer tree
        return document.getElementById("expanded_"+toLayer.moduleId)
    }),
    map( svgElement => {
      const boudingBox = svgElement.getBoundingClientRect()
      return [0.5*(boudingBox.left + boudingBox.right), 0.5*(boudingBox.top + boudingBox.bottom)] 
    })
  )
}

export function plugLayersTransition_noTransition(activeLayerUpdated$ : Observable<{fromLayerId:string,toLayerId:string}>, appStore: AppStore, drawingArea: DrawingArea) {

    mapToFocusCoordinate(activeLayerUpdated$, appStore)
    .subscribe( (coors) => drawingArea.lookAt(coors[0],coors[1]))
}

export function plugLayersTransition_test(activeLayerUpdated$ : Observable<{fromLayerId:string,toLayerId:string}>, appStore: AppStore, drawingArea: DrawingArea) {
    
    
    activeLayerUpdated$.subscribe( () => drawingArea.selectAll("g.connection").remove())

    mapToFocusCoordinate(activeLayerUpdated$, appStore)
    .subscribe( (coors) => {
      const zoom = drawingArea.zoom
      drawingArea.svgCanvas.transition()
        .duration(1000)
        .call(zoom.translateTo, coors[0], coors[1])
    }) 
}