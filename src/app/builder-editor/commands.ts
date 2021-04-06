
export function commandsBuilder() {

    function changeActiveBttnsState(selection : any, i : any = undefined) {
        /* when trigering command programatically, the button associated is not toggled, this is
        the purpose of this method. It is likely that something better exist in grapesjs */
        let elements = document.querySelectorAll(selection)
        let selectionClasses= ["gjs-pn-active","gjs-four-color"]
        elements.forEach( e => e.classList.remove(...selectionClasses))
        if(i != undefined)
            elements[i].classList.add(...selectionClasses)
    }
    
    return [
        ['show-attributes', {
            run(editor : any, sender : any) {
                const lmEl = document.getElementById("attributes-panel")
                changeActiveBttnsState("#panel__builder-managers-actions .gjs-pn-btn", 0 )
                if (lmEl)
                    lmEl.classList.remove("d-none") 
            },
            stop(editor : any, sender : any) {
                const lmEl = document.getElementById("attributes-panel")                
                changeActiveBttnsState("#panel__builder-managers-actions .gjs-pn-btn" )

                if (lmEl)
                    lmEl.classList.add("d-none") 
            },
        }],/*
        ['show-suggestions', {
            run(editor : any, sender : any) {
                const lmEl = document.getElementById("suggestions-panel")
                changeActiveBttnsState("#panel__builder-managers-actions .gjs-pn-btn", 3 )
                if (lmEl)
                    lmEl.classList.remove("d-none") 
            },
            stop(editor : any, sender : any) {
                const lmEl = document.getElementById("suggestions-panel")                
                changeActiveBttnsState("#panel__builder-managers-actions .gjs-pn-btn" )

                if (lmEl)
                    lmEl.classList.add("d-none") 
            },
        }],
        ['show-extensions', {
            run(editor : any, sender : any) {
                const lmEl = document.getElementById("extensions-panel")
                changeActiveBttnsState("#panel__builder-managers-actions .gjs-pn-btn", 4 )
                if (lmEl)
                    lmEl.classList.remove("d-none") 
            },
            stop(editor : any, sender : any) {
                changeActiveBttnsState("#panel__builder-managers-actions .gjs-pn-btn" )
                const lmEl = document.getElementById("extensions-panel")
                if (lmEl)
                    lmEl.classList.add("d-none") 
            },
        }],*/
        ['show-hide-panels', {
            run(editor : any, sender : any) {
                
                document.getElementById("panels-container-builder").classList.add("collapsed")
                let panel = document.getElementById("panel__right_builder")
                panel.classList.add("collapsed")
                panel.querySelectorAll(".flex-align-switch").forEach( (e:HTMLElement) => e.style.flexDirection = "column" )
                let buttons = panel.querySelector(".buttons-toolbox>.gjs-pn-buttons") as HTMLDivElement
                buttons.style.flexDirection = "column"
            },
            stop(editor : any, sender : any) {
                
                document.getElementById("panels-container-builder").classList.remove("collapsed")
                let panel = document.getElementById("panel__right_builder")
                panel.classList.remove("collapsed")
                panel.querySelectorAll(".flex-align-switch").forEach( (e:HTMLElement) => e.style.flexDirection = "row" )
                panel.querySelectorAll(".buttons-toolbox")
                let buttons = panel.querySelector(".buttons-toolbox>.gjs-pn-buttons") as HTMLDivElement
                buttons.style.flexDirection = "row"
                
            },
        }]
    ]
}
