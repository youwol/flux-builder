export function getBlocks() {
  return [
    {
      id: 'section',
      label: '<b>Section</b>', // You can use HTML/SVG inside labels
      category:"Basic",
      attributes: { class: 'gjs-block-section' },
      content: `<section>
        <h1>This is a simple title</h1>
        <div>This is just a Lorem text: Lorem ipsum dolor sit amet</div>
      </section>`,
      render( {el}:{el:any}) { el.classList.add("gjs-fonts","gjs-f-h1p") } 
    }, {
      id: 'text',
      label: 'Text',
      category:"Basic",
      content: '<div data-gjs-type="text">Insert your text here</div>', 
      render( {el}:{el:any}) { el.classList.add("gjs-fonts","gjs-f-text") } 
    }, {
      id: 'image',
      label: 'Image',
      category:"Basic",
      // Select the component once it's dropped
      select: true,
      // You can pass components as a JSON instead of a simple HTML string,
      // in this case we also use a defined component type `image`
      content: { type: 'image' },
      // This triggers `active` event on dropped components and the `image`
      // reacts by opening the AssetManager
      activate: true,
      render( {el}:{el:any}) { el.classList.add("gjs-fonts","gjs-f-image") }
    }, 
    {
      id: 'link',
      label: 'Link',
      category:"Basic",
      select: true,
      content: {
        type: 'link',
        content:'Text for the link',
        attributes: { href: '' }
      }
    },
    {
      id: '2-columns',
      label: '2 Columns',
      category:"Layouts",
      content: `
            <div class="" style="display:flex; width:100%; height:100%; padding:5px" data-gjs-droppable=".fx-row-cell" data-gjs-custom-name="Row">
              <div class="" style="min-width:50px; width:100%" data-gjs-draggable=".row" 
                data-gjs-resizable="resizerRight" data-gjs-name= "Cell"></div>
              <div class="" style="min-width:50px; width:100%"  data-gjs-draggable=".row"
                data-gjs-resizable="resizerRight" data-gjs-name= "Cell" ></div>
            </div>
          `,
      render( {el}:{el:any}) { el.classList.add("gjs-fonts","gjs-f-b2") }
    }/*,
    {
      id: 'Youwol',
      label: 'Youwol',
      category:"Layouts",
      content: `
            <div class="row vh-100" data-gjs-droppable=".row-cell" data-gjs-custom-name="Row">
              <div class="row-cell w-25 px-3 background-primary text-white" data-gjs-draggable=".row" 
                data-gjs-resizable="resizerRight" data-gjs-name= "Cell">

                <img data-gjs-type="image" draggable="true" src="api/cdn-backend/assets/logo_YouWol_Platform_white.png" class="w-50" id="ittd" class="logo gjs-hovered">

                <div class="h-separator my-3">  </div>
                <h4 class="text-center " > Title </h4>
                
                <div class="my-4">
                  <p class="lead text-justify"><em> This is some description </em></p> 
                </div>  
                <div class="h-separator  my-2">  </div>
                <div class="mt-4">
                  <p  class="text-justify" > Some content </p> 
                </div>  
              </div>
              <div class="row-cell w-75" data-gjs-draggable=".row"
                data-gjs-resizable="resizerRight" data-gjs-name= "Cell"></div>
            </div>
            <style>
              .logo{
                width:100%
              }
              .h-separator{
                background-color: white;
                padding:1px;
                display: block
              }
              .row {
                display: flex;
                justify-content: flex-start;
                align-items: stretch;
                flex-wrap: nowrap;
                padding: 10px;
                min-height: 75px;
              }
              .row-cell {
                flex-grow: 1;
                padding: 5px;
              }
            </style>
          `,
      render( {el}:{el:any}) { 
        let div =document.createElement("div")
        div.classList.add("v-flex")
        div.innerHTML =` <img data-gjs-type="image" draggable="true" src="/api/cdn-backend/assets/logo_YouWol_Platform_white.png" class="w-50" id="ittd" class="logo gjs-hovered">`
        el.appendChild(div) }
    }*/
  ]
}