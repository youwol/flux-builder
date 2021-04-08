import { child$ } from "@youwol/flux-view"
import { BehaviorSubject } from "rxjs"


export function infoView(text: string){

    let infoToggled$ = new BehaviorSubject(false)
    return child$(
        infoToggled$,
        (toggled) => {
            return {
                class:'p-1 d-flex',
                children:[
                    {   tag:'i', 
                        class:'fas fa-info fv-hover-bg-background-alt p-1 fv-pointer rounded ' 
                            + (toggled ? 'fv-bg-background-alt' : ''),
                        onclick: () => infoToggled$ .next(!infoToggled$.getValue())
                    },
                    toggled 
                        ? { class:'p-1 px-2 fv-bg-background-alt rounded', style:{'text-align': 'justify', 'font-style':'italic'},
                        innerText: text
                        }
                        : {}
                ]
            }
        }
    )
}
