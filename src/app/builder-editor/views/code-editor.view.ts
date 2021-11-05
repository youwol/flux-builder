/** @format */

import { child$, VirtualDOM } from '@youwol/flux-view'
import CodeMirror from 'codemirror'
import { BehaviorSubject, from } from 'rxjs'
import { mergeMap } from 'rxjs/operators'

export namespace CodeEditorView {
    export class State {
        public readonly content$: BehaviorSubject<string>

        constructor({ content$ }: { content$: BehaviorSubject<string> }) {
            this.content$ = content$
        }
    }

    type TOptions = {
        containerClass?: string
        containerStyle?: { [key: string]: string }
    }

    export class View implements VirtualDOM {
        static defaultOptions = {
            containerClass: 'h-100 w-100',
            containerStyle: {},
        }
        public readonly state: State
        public readonly class: string
        public readonly style: { [key: string]: string }
        public readonly children: Array<VirtualDOM>

        constructor({
            state,
            editorConfiguration,
            options,
            ...rest
        }: {
            state: State
            editorConfiguration: CodeMirror.EditorConfiguration
            options?: TOptions
        }) {
            Object.assign(this, rest)
            const styling: TOptions = {
                ...View.defaultOptions,
                ...(options ? options : {}),
            }
            this.state = state
            this.class = styling.containerClass
            this.style = styling.containerStyle
            const configuration = {
                ...{
                    value: state.content$.getValue(),
                    mode: 'javascript',
                    lineNumbers: true,
                    theme: 'blackboard',
                    extraKeys: {
                        Tab: (cm) => cm.replaceSelection('    ', 'end'),
                    },
                },
                ...(editorConfiguration || {}),
            }

            this.children = [
                child$(
                    this.fetchCodeMirror$(configuration.mode as string),
                    () => {
                        return {
                            id: 'code-mirror-editor',
                            class: 'w-100 h-100',
                            connectedCallback: (elem) => {
                                const editor: CodeMirror.Editor = window[
                                    'CodeMirror'
                                ](elem as ParentNode, configuration)
                                editor.on('changes', () => {
                                    state.content$.next(editor.getValue())
                                })
                            },
                        }
                    },
                ),
            ]
        }

        fetchCodeMirror$(mode: string) {
            const cdn = window['@youwol/cdn-client']

            const urlsMode = {
                javascript: 'codemirror#5.52.0~mode/javascript.min.js',
                python: 'codemirror#5.52.0~mode/python.min.js',
                css: 'codemirror#5.52.0~mode/css.min.js',
                xml: 'codemirror#5.52.0~mode/xml.min.js',
                html: 'codemirror#5.52.0~mode/htmlmixed.min.js',
            }
            return from(
                cdn.fetchBundles({ codemirror: { version: '5.52.0' } }, window),
            ).pipe(
                mergeMap(() => {
                    const urls = Array.isArray(urlsMode[mode])
                        ? urlsMode[mode]
                        : [urlsMode[mode]]

                    const promise = cdn.fetchJavascriptAddOn(urls, window)
                    return from(promise)
                }),
            )
        }
    }
}
