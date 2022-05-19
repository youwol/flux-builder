/** @format */

import { render, VirtualDOM } from '@youwol/flux-view'
import { Button } from '@youwol/fv-button'
import { Modal } from '@youwol/fv-group'
import { merge, Observable, Subject } from 'rxjs'

export namespace ModalView {
    export function popup({
        view,
        style,
        ok$,
        options,
    }: {
        view: VirtualDOM
        ok$?: Subject<MouseEvent>
        style?: { [key: string]: string }
        options?: { displayOk: boolean; displayCancel: boolean }
    }): Observable<MouseEvent> {
        options = options || { displayOk: true, displayCancel: true }

        const okBttn = new Button.View({
            state: new Button.State(),
            contentView: () => ({ innerText: 'Ok' }),
            class: 'fv-btn fv-btn-primary fv-bg-focus mr-2',
        } as any)

        const cancelBttn = Button.simpleTextButton('Cancel')

        const modalState = new Modal.State(ok$)
        const modalDiv = render(
            new Modal.View({
                state: modalState,
                contentView: () => {
                    return {
                        class: 'border rounded fv-text-primary fv-bg-background d-flex flex-column',
                        style: style
                            ? style
                            : {
                                  height: '50vh',
                                  width: '50vw',
                                  'max-width': '1500px',
                              },
                        children: [
                            view,
                            {
                                class: 'd-flex p-2',
                                children: [
                                    options.displayOk ? okBttn : undefined,
                                    options.displayCancel
                                        ? cancelBttn
                                        : undefined,
                                ].filter((d) => d),
                            },
                        ],
                    }
                },
                connectedCallback: (elem) => {
                    const subs = [
                        okBttn.state.click$.subscribe(() =>
                            modalState.ok$.next(),
                        ),
                        cancelBttn.state.click$.subscribe(() =>
                            modalState.cancel$.next(),
                        ),
                        merge(modalState.cancel$, modalState.ok$).subscribe(
                            () => modalDiv.remove(),
                        ),
                    ]
                    elem.subscriptions = [...elem.subscriptions, ...subs]
                },
            } as any),
        )

        document.querySelector('body').appendChild(modalDiv)
        return modalState.ok$
    }
}
