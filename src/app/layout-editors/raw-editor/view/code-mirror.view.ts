/** @format */

import { VirtualDOM } from '@youwol/flux-view'
import CodeMirror from 'codemirror'
import { Subscription } from 'rxjs'
import { PresenterUiState } from '../../../page'
import { TypeDoc } from '../model'
import { PresenterDoc } from '../presenter'
import { markDocument, showMark } from './text-marker.view'

export function codeMirrorView<typeDoc extends TypeDoc>(
    typeDocValue: typeDoc,
    presenter: PresenterDoc,
    presenterUiState: PresenterUiState,
): VirtualDOM {
    const subscriptions: Subscription[] = []
    return {
        class: 'h-100 w-50 d-flex',
        connectedCallback: (element: HTMLElement) => {
            const marksSubscriptions: Subscription[] = []
            const marksByModuleId = new Map<
                string,
                CodeMirror.TextMarker<CodeMirror.MarkerRange>
            >()
            const cmEditor = window['CodeMirror'](element as ParentNode, {
                mode: typeDocValue === 'html' ? 'htmlmixed' : 'css',
                lineNumbers: true,
                theme: 'blackboard',
                lineWrapping: true,
                extraKeys: {
                    'Ctrl-Enter': (_editor) => {
                        presenter.save()
                    },
                    'Ctrl-Space': (_editor) => {
                        presenter.insert()
                    },
                },
            })
            presenter.setCodeMirrorDoc(cmEditor.getDoc())
            cmEditor.on('changes', (editor) =>
                presenter.change(editor.getDoc().getValue()),
            )
            subscriptions.push(
                presenter.content$.subscribe((content) => {
                    cmEditor.setValue(content)
                }),
                presenter.positions$.subscribe(
                    markDocument(
                        typeDocValue,
                        cmEditor,
                        marksSubscriptions,
                        marksByModuleId,
                    ),
                ),
                presenter.showModule$.subscribe((moduleId) =>
                    showMark(cmEditor, marksByModuleId.get(moduleId)),
                ),
                presenterUiState
                    .getPresenterViewState('raw-editor')
                    .state$.subscribe(() => cmEditor.refresh()),
            )
        },
        disconnectedCallback: () =>
            subscriptions.forEach((subscription) => subscription.unsubscribe()),
    }
}
