


export function grapesButton({onclick, title, classes}){

    return {
        onclick,
        children:[
            {
                tag: 'span',
                class: 'gjs-pn-btn gjs-pn-active fv-text-focus d-flex align-items-center ',
                children:[
                    {
                        tag: 'i',
                        class: classes+ " px-1"
                    },
                    {   tag: 'div',
                        style:{'font-weight':'lighter', 'letter-spacing':'1px'},
                        class: 'px-1',
                        innerText: title
                    }]
            }
        ]
    }
}