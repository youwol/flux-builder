import { VirtualDOM } from "@youwol/flux-view";
import { AppStore } from "../builder-editor/builder-state";
import { builderView } from "../builder-editor/views/builder.view";
import { renderView } from "../grapesjs-editor/views/render.view";
import { topBanner } from "./top-banner.view";



function notificationsView(appStore: AppStore) : VirtualDOM {

    return {
        id:"notifications-container"
    }
}


export function mainView(appStore: AppStore): VirtualDOM {

    const view = {
        id: 'main-container',
        class: "h-100 w-100 d-flex flex-column",
        children: [
            topBanner(appStore),
            {   
                class:"flex-grow-1",
                style:{ minHeight: "0px"},
                children:[
                    builderView(appStore),
                    renderView(appStore),
                ]
            },
            notificationsView(appStore),
        ]
    }
    return view
}
