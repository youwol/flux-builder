

export function getConnections$(connectionsUpdated$ ){
    /*let maping = ( c : Connection) => ({
        //data: { input : c.end, output: c.start},
        data: c,
        classes : ["connection"], id: c.end.moduleId+"-"+c.start.moduleId,
        selector1 : "g#"+ c.end.moduleId + "-"+c.end.slotId+".plug.input."+c.end.moduleId+" circle",
        x1:  (element) : number => Number(element.getAttribute("x1")),
        y1:  (element) : number => Number(element.getAttribute("y1")),
        selector2 : "g#"+ c.start.moduleId + "-"+c.start.slotId+".plug.output."+c.start.moduleId+" circle",
        x2: (element) : number=> Number(element.getAttribute("x2")),
        y2: (element)  : number=> Number(element.getAttribute("y2")),
    }) 

    return connectionsUpdated$.pipe(
        operators.map( (connections:Array<Connection>) =>
            connections.reduce( (acc: any, c:Connection) => acc.concat( maping(c) ),[] ))            
    )*/
}
export function convert(bbox,matrix,drawingArea) {
    const offset = document.getElementById(drawingArea.svgCanvas.attr("id")).getBoundingClientRect();
    const transform = drawingArea.overallTranform
    const a = {
      xmin: ((matrix.a * bbox.x) + (matrix.c * bbox.y) + matrix.e - offset.left 
      - transform.translateX)/transform.scale,
      ymin: ((matrix.b * bbox.x) + (matrix.d * bbox.y) + matrix.f - offset.top
      - transform.translateY)/transform.scale,
      xmax: ((matrix.a * (bbox.x+bbox.width)) + (matrix.c * (bbox.y+bbox.height)) + matrix.e - offset.left
      - transform.translateX)/transform.scale,
      ymax: ((matrix.b * (bbox.x+bbox.width)) + (matrix.d * (bbox.y+bbox.height)) + matrix.f - offset.top 
      - transform.translateY)/transform.scale
    }
    return a
}

export function getBoundingBox(modulesId:Array<string>,margin:number,drawingArea ){
        
    const bbox= modulesId
    .map( (mid: string) => document.getElementById(mid))
    .filter(e => e)
    .map( (e:any) => convert(e.getBBox(),e.getScreenCTM(),drawingArea) )
    .reduce( (acc,e)=>({
        xmin:Math.min(acc.xmin,e.xmin),xmax:Math.max(acc.xmax,e.xmax),
        ymin:Math.min(acc.ymin,e.ymin),ymax:Math.max(acc.ymax,e.ymax)
    }),  {xmin:1e6,xmax:-1e6,ymin:1e6,ymax:1e-6})
    
    return {x:bbox.xmin-margin, 
            y:bbox.ymin-margin,
            width:bbox.xmax-bbox.xmin+2*margin,
            height:bbox.ymax-bbox.ymin+2*margin}
}