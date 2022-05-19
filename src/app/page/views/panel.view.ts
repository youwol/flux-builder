/** @format */

import { attr$, VirtualDOM } from '@youwol/flux-view'
import { Observable, of } from 'rxjs'
import { map } from 'rxjs/operators'
import { AppStore } from '../../builder-editor/builder-state'
import { factoryFlowBuilderView } from '../../builder-editor/views/factory-flow-builder.view'
import { factoryGrapejsEditorView } from '../../layout-editors/grapesjs-editor/views/factory-grapejs-editor.view'
import { factoryRawEditorView } from '../../layout-editors/raw-editor'
import { NumberPanes, RenderViewName, RenderViewPosition } from '../model'
import { PresenterUiState, PresenterViewState } from '../presenter'
import { IconForRendersView } from './icon-for-renders-view'
import { factoryRunnerView } from './factory-runner.view'

type ButtonVisibility = 'visible' | 'hidden' | 'disabled'

export function panelView(
    renderViewName: RenderViewName,
    appStore: AppStore,
    presenterUiState: PresenterUiState,
): VirtualDOM {
    const panel = viewsFactories[renderViewName](appStore, presenterUiState)
    const presenterViewState =
        presenterUiState.getPresenterViewState(renderViewName)
    return {
        id: `panel_${renderViewName}`,
        tag: 'div',
        class: attr$(
            presenterViewState.state$,
            ({ position, numberPanes }) =>
                `${getClassesPosition(position)} ${getClassesNumberPanes(
                    numberPanes,
                )} border-top`,
        ),
        children: [
            {
                id: `panel_${renderViewName}_buttons`,
                class: 'd-flex flex-column border-right fv-bg-background grapes-bg-color justify-content-between',
                // style: { width: '36px' },
                children: [
                    {
                        children: [
                            button(
                                'fa-times',
                                () => presenterViewState.close(),
                                presenterUiState.uiState$.pipe(
                                    map((uiState) =>
                                        uiState.numberPanes === 1
                                            ? 'hidden'
                                            : 'visible',
                                    ),
                                ),
                            ),
                        ],
                    },
                    {
                        children: presenterUiState.availableRendersViews.map(
                            (availableRenderView) =>
                                buttonRender(
                                    presenterViewState,
                                    renderViewName,
                                    availableRenderView,
                                ),
                        ),
                    },
                    {
                        children: [
                            button(
                                'fa-plus',
                                () => presenterUiState.addPane(),
                                presenterUiState.uiState$.pipe(
                                    map(() =>
                                        presenterUiState.hiddenRendersViews
                                            .length !== 0
                                            ? 'visible'
                                            : 'hidden',
                                    ),
                                ),
                            ),
                        ],
                    },
                ],
            },
            panel,
        ],
    }
}

const viewsFactories: Record<
    RenderViewName,
    (appStore: AppStore, presenterUiState: PresenterUiState) => VirtualDOM
> = {
    'flow-builder': factoryFlowBuilderView,
    'grapejs-editor': factoryGrapejsEditorView,
    'raw-editor': factoryRawEditorView,
    runner: factoryRunnerView,
}

function button(
    iconClass: string,
    onclick: () => void,
    visibility$: Observable<ButtonVisibility>,
): VirtualDOM {
    return {
        // type: 'button',
        // tag: 'button',
        // class: 'panel-btn fv-btn fv-color-on-secondary fv-bg-secondary fv-pointer mb-1',
        class: attr$(
            visibility$,
            (visibility: ButtonVisibility): string => {
                switch (visibility) {
                    case 'visible':
                        return 'fv-pointer fv-hover-text-secondary fv-text-focus'
                    case 'hidden':
                        return 'd-none'
                    case 'disabled':
                        return 'fv-text-disabled'
                }
            },
            {
                wrapper: (dynClasses) =>
                    `w-100 px-1 text-center mx-auto ${dynClasses}`,
            },
        ),
        children: [
            {
                tag: 'i',
                class: iconClass + ' fas',
            },
        ],
        disabled: attr$(
            visibility$,
            (visibility: ButtonVisibility) => visibility === 'hidden',
        ),
        // style: attr$(disabled$, (disabled) =>
        //     disabled ? { opacity: 0.5 } : { opacity: 1 },
        // ),
        onclick: attr$(visibility$, (visibility: ButtonVisibility) =>
            visibility !== 'visible'
                ? () => {
                      /*NOOP*/
                  }
                : onclick,
        ),
    }
}

function buttonRender(
    presenterViewState: PresenterViewState,
    renderViewName: RenderViewName,
    otherRenderView: RenderViewName,
): VirtualDOM {
    return button(
        IconForRendersView[otherRenderView],
        () => presenterViewState.change(otherRenderView),
        of<ButtonVisibility>(
            renderViewName === otherRenderView ? 'disabled' : 'visible',
        ),
    )
}

function getClassesNumberPanes(numberPanes: NumberPanes): string {
    switch (numberPanes) {
        case 1:
            return 'h-100'
        case 2:
            return 'h-50'
        case 3:
            return 'h-33'
    }
}

function getClassesPosition(position: RenderViewPosition): string {
    switch (position) {
        case 'top':
            return 'd-flex order-first'
        case 'middle':
            return 'd-flex'
        case 'bottom':
            return 'd-flex order-last'
        case 'none':
            return 'd-none'
    }
}
