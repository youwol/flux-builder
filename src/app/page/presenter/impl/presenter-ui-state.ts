/** @format */

import { ReplaySubject } from 'rxjs'
import { v } from '../../../externals_evolutions/logging'
import { Conf, NumberPanes, RenderViewName, UiState } from '../../model'
import { logFactory } from '..'
import { numberPanes } from '../../model/model-ui-state'
import { PresenterUiState } from '../presenter-ui-state'
import { PresenterViewState } from './presenter-view-state'

const log = logFactory().getChildLogger('UiState')

export class ImplPresenterUiState implements PresenterUiState {
    private readonly current: UiState
    public readonly uiState$: ReplaySubject<UiState> = new ReplaySubject(1)

    constructor(private readonly conf: Conf) {
        this.current = this.conf.initUiState
        this.uiState$.next(this.current)
    }

    public getPresenterViewState(view: RenderViewName): PresenterViewState {
        log.debug('Returning PresenterViewState for {0}', v(view))
        return new PresenterViewState(this, view)
    }

    get availableRendersViews(): RenderViewName[] {
        return this.conf.availableRendersViews
    }

    get hiddenRendersViews(): RenderViewName[] {
        return this.conf.availableRendersViews.filter(
            (candidate) => this.current.getPosition(candidate) === 'none',
        )
    }

    get alternateUrl(): string {
        return this.conf.altUrlQueryParams
    }

    public remove(renderViewName: RenderViewName) {
        this.current.removeRenderView(renderViewName)
        this.uiState$.next(this.current)
    }

    public switch(
        currentRenderView: RenderViewName,
        nextRenderView: RenderViewName,
    ) {
        this.current.switchRenderView(currentRenderView, nextRenderView)
        this.uiState$.next(this.current)
    }

    addPane(): void {
        const nextNumberPanes = this.current.numberPanes + 1
        if (nextNumberPanes > numberPanes[numberPanes.length - 1]) {
            throw new Error('Cannot add pane')
        }
        this.current.numberPanes = nextNumberPanes as NumberPanes
        this.uiState$.next(this.current)
    }
}
