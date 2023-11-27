import {
    flattenSchemaWithValue,
    ModuleConfiguration,
    ModuleFlux,
} from '@youwol/flux-core'
import { child$, HTMLElement$, VirtualDOM } from '@youwol/flux-view'
import { BehaviorSubject, Subscription } from 'rxjs'
import { filter, withLatestFrom } from 'rxjs/operators'
import { AppStore } from '../builder-state'
import { AutoForm } from './auto-form.view'
import { CodePropertyEditorView } from './code-property-editor.view'

function codeEditorView(
    faClass: string,
    mdle: ModuleFlux,
    value$: BehaviorSubject<string>,
    description: AutoForm.ValueDescription,
) {
    const editorConfiguration = description.metadata.editorConfiguration || {}
    return {
        class: `${faClass} fv-pointer fa-2x fv-hover-bg-background`,
        onclick: () =>
            CodePropertyEditorView.popupModal({
                mdle: mdle,
                initialCode: value$.getValue(),
                editorConfiguration,
                onUpdate: (content) => value$.next(content),
            }),
    }
}

const elementViewsFactory = (mdle: ModuleFlux) => [
    {
        test: (value: AutoForm.ValueDescription) => {
            return (
                value.metadata &&
                value.metadata.type == 'code' &&
                (!value.metadata.editorConfiguration ||
                    value.metadata.editorConfiguration.mode == 'javascript')
            )
        },
        view: (
            value$: BehaviorSubject<string>,
            description: AutoForm.ValueDescription,
        ) => {
            return codeEditorView('fab fa-js-square', mdle, value$, description)
        },
    },
    {
        test: (value: AutoForm.ValueDescription) => {
            return (
                value.metadata &&
                value.metadata.type == 'code' &&
                value.metadata.editorConfiguration.mode == 'css'
            )
        },
        view: (
            value$: BehaviorSubject<string>,
            description: AutoForm.ValueDescription,
        ) => {
            return codeEditorView('fab fa-css3-alt', mdle, value$, description)
        },
    },
    {
        test: (value: AutoForm.ValueDescription) => {
            return (
                value.metadata &&
                value.metadata.type == 'code' &&
                (value.metadata.editorConfiguration.mode == 'html' ||
                    value.metadata.editorConfiguration.mode == 'htmlmixed' ||
                    value.metadata.editorConfiguration.mode == 'xml')
            )
        },
        view: (
            value$: BehaviorSubject<string>,
            description: AutoForm.ValueDescription,
        ) => {
            return codeEditorView('fab fa-html5', mdle, value$, description)
        },
    },
    ...AutoForm.viewFactory,
]

export class ModuleSettingsState {
    public readonly onTheFlyUpdates$ = new BehaviorSubject<boolean>(true)
    public readonly autoFormState: AutoForm.State
    public readonly initialSettings$: BehaviorSubject<any>

    subscriptions: Subscription[]

    constructor(
        public readonly mdle: ModuleFlux,
        public readonly appStore: AppStore,
    ) {
        const schemaWithValue = flattenSchemaWithValue(mdle.configuration.data)
        Object.keys(schemaWithValue).forEach(
            (k) => (schemaWithValue[k] = schemaWithValue[k][0]),
        )

        const configurationIn$ = new BehaviorSubject<Object>(
            mdle.configuration.data,
        )
        this.initialSettings$ = new BehaviorSubject(mdle.configuration.data)

        this.autoFormState = new AutoForm.State(
            configurationIn$,
            schemaWithValue as any,
            elementViewsFactory(mdle),
        )
        const sub = this.autoFormState.currentValue$
            .pipe(
                withLatestFrom(this.onTheFlyUpdates$),
                filter(([_, onTheFly]) => onTheFly),
                filter(
                    ([value]) =>
                        JSON.stringify(value) !=
                        JSON.stringify(this.initialSettings$.getValue()),
                ),
            )
            .subscribe(() => this.applySettings())

        this.subscriptions = [sub]
    }

    toggleUpdatePolicy() {
        this.onTheFlyUpdates$.next(!this.onTheFlyUpdates$.getValue())
    }

    applySettings(title: string = undefined) {
        const values = this.autoFormState.currentValue$.getValue()

        const persistentData = new this.mdle.Factory.PersistentData(values)
        const conf = new ModuleConfiguration({
            title: title ? title : this.mdle.configuration.title,
            description: this.mdle.configuration.description,
            data: persistentData,
        })

        this.initialSettings$.next(values)
        this.appStore.updateModule(this.mdle, conf, false)
    }
}

export class ModuleSettingsView implements VirtualDOM {
    public readonly class = 'h-100 d-flex flex-column'
    public readonly children: VirtualDOM[]
    public readonly style = { fontSize: 'smaller' }

    connectedCallback?: (d: HTMLElement$) => void

    public readonly applyChangesButton = {
        children: [
            {
                class: 'fas fa-sync fv-text-focus fv-hover-bg-background p-1 border rounded fv-pointer',
            },
        ],
        onclick: () => this.state.applySettings(),
    }

    constructor(public readonly state: ModuleSettingsState) {
        this.children = [
            this.header(),
            new AutoForm.View({
                state: state.autoFormState,
                class: 'flex-grow-1 overflow-auto my-1',
                style: { 'min-height': '0px' },
            } as any),
        ]
        this.connectedCallback = (elem: HTMLElement$) => {
            elem.ownSubscriptions(...state.subscriptions)
        }
    }

    header(): VirtualDOM {
        return {
            class: 'border rounded p-1',
            children: [
                child$(this.state.onTheFlyUpdates$, (onTheFly) =>
                    this.updatePolicyView(onTheFly),
                ),
                {
                    class: 'd-flex align-items-center py-2 justify-content-around',
                    children: [
                        {
                            innerText: "Module's title",
                            class: 'my-auto',
                        },
                        {
                            tag: 'input',
                            type: 'text',
                            value: this.state.mdle.configuration.title,
                            onchange: (event) => {
                                this.state.applySettings(event.target.value)
                            },
                        },
                    ],
                },
            ],
        }
    }

    updatePolicyView(onTheFly: boolean): VirtualDOM {
        return {
            class: 'd-flex align-items-center',
            children: [
                {
                    tag: 'input',
                    type: 'checkbox',
                    checked: onTheFly,
                    onclick: () => this.state.toggleUpdatePolicy(),
                },
                { class: 'px-2', innerText: 'auto apply changes' },
                onTheFly ? {} : this.applyChangesButton,
            ],
        }
    }
}
