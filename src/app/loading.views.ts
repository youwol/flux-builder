import { CdnEvent, LoadingGraphError, SourceLoadedEvent, SourceLoadingEvent, StartEvent, UnauthorizedEvent } from "@youwol/cdn-client"


export function loadingProjectView(loadingDiv: HTMLDivElement){
    const divProjectLoading = document.createElement('div')
    divProjectLoading.style.setProperty("color", "lightgray") 
    divProjectLoading.innerText = `> project loading...` 
    loadingDiv.appendChild(divProjectLoading)
    return divProjectLoading
}

export function loadingLibView(event: CdnEvent, loadingDiv: HTMLDivElement){
    
    const libraryName = event.targetName
    const cssId = libraryName.replace("/","-").replace("@","")
    let divLib = document.querySelector(`#${cssId}`) as HTMLDivElement
    if(!divLib){
        divLib = document.createElement('div')
        divLib.id =cssId
        loadingDiv.appendChild(divLib)
    }
    if( event instanceof StartEvent ){
        divLib.style.setProperty("color", "lightgray") 
        divLib.innerText = `> ${libraryName} ... loading: 0 kB` 
    }

    if( event instanceof SourceLoadingEvent){
        divLib.style.setProperty("color", "lightgray") 
        divLib.innerText = `> ${libraryName} ... loading: ${event.progress.loaded/1000} kB`
    }
    if( event instanceof SourceLoadedEvent){
        divLib.style.setProperty("color", "green") 
        divLib.innerText = `> ${libraryName} ${event.progress.loaded/1000} kB`
    }       
    if( event instanceof UnauthorizedEvent ){
        divLib.style.setProperty("color", "red") 
        divLib.style.setProperty("font-size", "small") 
        divLib.innerText = `> ${libraryName} : You don't have permission to access this resource.`
    }     
}

export function loadingErrorView(error: Error, loadingDiv: HTMLDivElement){

    const divError = document.createElement('div')
    if( error instanceof LoadingGraphError){
        divError.style.setProperty("color", "red") 
        loadingDiv.appendChild(divError) 

        error.errorResponse.then(r => {
            divError.innerText = `x -> ${r.detail}\n`
            if(r.parameters && r.parameters.packages){
                divError.innerText += r.parameters.packages
            }
            console.log(r) 
        } ) 
    }
}

export function includeYouWolLogoView(){
    document.getElementById("youwol-logo-loading-screen").innerText = `
                *@@@@@@,         
                *@@@@@@,                
      /@@@@@@%  *@@@@@@,  %@@@@@@(      
    ,&@@@@@@@@@@@@@@@@@@@@@@@@@@@@&*    
         %@@@@@@@@@@@@@@@@@@@@%         
(            /@@@@@@@@@@@@/            /
@@@@#.           ,&@@&*           .#@@@@
@@@@@@@@@.                    .@@@@@@@@@
#@@@@@@@@@@@@(            (@@@@@@@@@@@@#
    /@@@@@@@@@@@#      #@@@@@@@@@@@(    
    *@@@@@@@@@@@#      #@@@@@@@@@@@/    
(@@@@@@@@@@@@@@@#      #@@@@@@@@@@@@@@@#
@@@@@@@@@*&@@@@@#      #@@@@@&,@@@@@@@@@
 .#@%.    &@@@@@#      #@@@@@&    .#@%. 
          &@@@@@#      #@@@@@&          
          ,@@@@@#      #@@@@@,          
              .##      ##.    
`
}