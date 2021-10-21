/** @format */

import { VirtualDOM } from '@youwol/flux-view'
import { Subscription } from 'rxjs'
import { PresenterUiState } from '../../page/'
import { TypeDoc } from '../model'
import { ContractPresenterDoc } from '../presenter'
import { markDocument } from './text-marker.view'

export function factoryCodeMirrorView<typeDoc extends TypeDoc>(
    typeDoc: TypeDoc,
    presenter: ContractPresenterDoc,
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
                        presenter.onSave()
                    },
                    'Alt-Tab': (editor) => {
                        presenter.onInsert(editor.getDoc())
                    },
                },
            })
            cmEditor.on('changes', (editor) =>
                presenter.onChange(editor.getDoc().getValue()),
            )
            subscriptions.push(
                presenter.content$.subscribe((content) => {
                    cmEditor.setValue(content)
                }),
                presenter.modulesPositions$.subscribe(
                    markDocument(typeDoc, cmEditor, marksSubscriptions),
                ),
                presenterUiState
                    .getViewState('editor')
                    .state$.subscribe(() => cmEditor.refresh()),
            )
        },
        disconnectedCallback: () =>
            subscriptions.forEach((subscription) => subscription.unsubscribe()),
    }
}
