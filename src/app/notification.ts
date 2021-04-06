import { render } from '@youwol/flux-view';


export class Notifier{

    static classesIcon={
        4: "fas fa-2x fa-exclamation-circle text-danger px-2 mt-auto mb-auto",
        3: "fas fa-2x fa-exclamation text-warning px-2 mt-auto mb-auto",
    }
    static classesBorder={
        4: "border-danger",
        3: "border-warning",
    }


    static notify({message, title, actions}){

        Notifier.popup( { message, title, actions, classIcon:"", classBorder:"" } )
    }

    static error( {message, title, actions}){

        Notifier.popup( { message, title, actions, classIcon:Notifier.classesIcon[4], classBorder:Notifier.classesBorder[4] } )
    }

    static warning( {message, title, actions}){

        Notifier.popup( { message, title, actions, classIcon:Notifier.classesIcon[3], classBorder:Notifier.classesBorder[3] } )
    }

    private static popup( { message, title, actions, classIcon, classBorder } ){

        let view = {
            class:"m-2 p-2 my-1 bg-white " + classBorder,
            style: {border:'solid'},
            children:[
                {
                    class:"fas fa-times",
                    style:{float:'right',cursor:'pointer'},
                    onclick: (event)=> {
                        event.target.parentElement.remove()
                    } 
                },
                {
                    class:'d-flex py-2',
                    children:[
                        {tag:'i', class: classIcon },
                        {
                            children:[
                                {tag:'span', class:'d-block',innerText:title},
                                {tag:'span', class:'d-block', innerText:message}
                            ]
                        }
                    ]
                },
                {
                    class:'d-flex align-space-around',
                    children: actions.map( action => ({
                        tag:'span', 
                        class:"px-1 mx-1 ", 
                        innerText: action.name, 
                        onclick: ()=>action.exe(), 
                        style: {cursor:'pointer', 'background-color': 'darkslategrey', color:'white'}
                    }))
                }
            ]
        }
        let div = render(view)
        document.getElementById("notifications-container").appendChild(div)
    }
}