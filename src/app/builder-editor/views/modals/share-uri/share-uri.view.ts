import { AppStore } from '../../../builder-state/index'

import { VirtualDOM, render, attr$ } from '@youwol/flux-view'
import { Modal } from '@youwol/fv-group'
import { Button } from '@youwol/fv-button'
import { Select } from '@youwol/fv-input'
import { combineLatest, from } from 'rxjs'
import { mergeMap } from 'rxjs/operators'

export function shareProjectURIView(appStore: AppStore) {

  let copyLinkBttn = new Button.View({
    state: new Button.State(),
    contentView: () => ({ innerText: '' }),
    class: "fv-btn fv-btn-primary fv-bg-focus fas fa-copy ml-2"
  } as any)

  let toUrl = ( uri: string, mode: string) => {
    if(mode=='relative-url')
       return `${uri}`
    if(mode=='localhost-url')
       return `${location.hostname}:${location.port}${uri}`
    return `https://platform.youwol.com${uri}`
  }

  let selectItems = [
      new Select.ItemData('youwol-url','YouWol Platform URL'),
      new Select.ItemData('relative-url','Relative URL')
  ]
  if( location.hostname=='localhost')
    selectItems.push(new Select.ItemData('localhost-url','Localhost URL'))

  let selectState = new Select.State(selectItems,'youwol-url')
  let sourceURI$ = combineLatest([appStore.projectURI$(), selectState.selectionId$])

  let content = {
    class: 'fv-bg-background p-3 fv-text-primary rounded border',
    style: { width: '50vw' },
    children: [
      {
        innerText: 'The following url can be used to share your application:'
      },
      new Select.View({state: selectState}),
      {
        class: 'd-flex align-items-center',
        children: [
          {
            style: { 'text-overflow': 'ellipsis', 'white-space': 'nowrap', 'overflow': 'hidden', 'font-family': 'monospace' },
            innerText: attr$(
              sourceURI$,
              ([uri, mode]) => toUrl(uri, mode)
            )
          },
          copyLinkBttn
        ]
      },
      { class:'d-flex align-items-center fv-bg-background-alt rounded my-3',
        children:[
          {
            class:'fas fa-exclamation fv-text-focus px-2'
          },
          {
            innerText: "This feature is a work in progress, it is expected to work with 'relatively' small application for now. "+
            "Also, the consumer of this link will need to have access to all packages/modules/resources included in your app."
          }
        ]
      }
    ]
  } as VirtualDOM

  let modalState = new Modal.State(copyLinkBttn.state.click$)
  let view = new Modal.View({
    state: modalState,
    contentView: () => content,
    connectedCallback: (elem) => {
        elem.subscriptions.push(
            modalState.cancel$.subscribe( () => elem.remove())
        )
        elem.subscriptions.push(
            modalState.ok$.pipe(
                mergeMap( () => sourceURI$ ),
                mergeMap( ([uri, mode]) => from(navigator.clipboard.writeText(toUrl(uri, mode)))) 
              ).subscribe(() => elem.remove())
        )
    }
  } as any)

  let modalDiv = render(view)
  document.querySelector("body").appendChild(modalDiv)
}
