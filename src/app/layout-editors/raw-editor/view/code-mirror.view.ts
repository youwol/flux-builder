/** @format */

import { VirtualDOM } from '@youwol/flux-view'
import { Subscription } from 'rxjs'
import { PresenterUiState } from '../../../page'
import { TypeDoc } from '../model'
import { PresenterDoc } from '../presenter'
import { markDocument } from './text-marker.view'

export function codeMirrorView<typeDoc extends TypeDoc>(
    typeDoc: TypeDoc,
    presenter: PresenterDoc,
    presenterUiState: PresenterUiState,
): VirtualDOM {
    const subscriptions: Subscription[] = []
    return {
        class: 'h-100 w-50 d-flex',
        connectedCallback: (element: HTMLElement) => {
            const marksSubscriptions: Subscription[] = []
            const cmEditor = window['CodeMirror'](element as ParentNode, {
                mode: typeDoc === 'html' ? 'htmlmixed' : 'css',
                lineNumbers: true,
                theme: 'blackboard',
                lineWrapping: true,
                extraKeys: {
                    'Ctrl-Enter': (_editor) => {
                        presenter.save()
                    },
                    'Alt-Tab': (editor) => {
                        presenter.insert(editor.getDoc())
                    },
                },
            })
            cmEditor.on('changes', (editor) =>
                presenter.change(editor.getDoc().getValue()),
            )
            subscriptions.push(
                presenter.content$.subscribe((content) => {
                    cmEditor.setValue(content)
                }),
                presenter.positions$.subscribe(
                    markDocument(typeDoc, cmEditor, marksSubscriptions),
                ),
                presenterUiState
                    .getPresenterViewState('raw-layout-editor')
                    .state$.subscribe(() => cmEditor.refresh()),
            )
        },
        disconnectedCallback: () =>
            subscriptions.forEach((subscription) => subscription.unsubscribe()),
    }
}
