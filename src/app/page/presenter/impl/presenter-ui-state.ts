/** @format */

import { ReplaySubject } from 'rxjs'
import { v } from '../../../externals_evolutions/logging'
import {
    Conf,
    Features,
    RenderViewName,
    RenderViewPosition,
    UiState,
} from '../../model'
import { PresenterUiState } from '../presenter-ui-state'
import { logFactory } from '../'
import { getFeatures } from './presenter-conf'
import { PresenterViewState } from './presenter-view-state'

const log = logFactory().getChildFactory('UiState')

export class ImplPresenterUiState implements PresenterUiState {
    private log
    private current: UiState
    private readonly uiState$: ReplaySubject<UiState>
    public readonly split$: ReplaySubject<boolean>

    constructor(private readonly conf: Conf) {
        this.current = this.conf.initState
        this.uiState$ = new ReplaySubject(1)
        this.split$ = new ReplaySubject(1)
        this.uiState$.next(this.current)
        this.log = log.getChildLogger(`[${toString(this.current)}]`)
        this.uiState$.next(this.current)
        this.split$.next(this.current.kind === 'split')
    }

    public toggleSplit(): void {
        this.log.debug('toggle split')
        this.current =
            this.current.kind === 'mono'
                ? {
                      kind: 'split',
                      topView: this.current.view,
                      bottomView:
                          this.current.view === 'builder'
                              ? this.conf.defaultBottom
                              : 'builder',
                  }
                : {
                      kind: 'mono',
                      view: this.current.topView,
                  }
        this.log = logFactory()
            .getChildLogger('UiState')
            .getChildLogger(toString(this.current))
        this.log.debug('new state')
        this.uiState$.next(this.current)
        this.split$.next(this.current.kind === 'split')
    }

    public toggleView(view: RenderViewName, pos: RenderViewPosition = 'top') {
        this.log.debug('toggle view {0}', v(view))
        if (pos === 'bottom' && this.current.kind === 'mono') {
            this.toggleSplit()
        }
        if (this.current.kind === 'mono') {
            if (this.current.view !== view) {
                this.current.view = view
            }
        } else {
            if (pos === 'top') {
                this.current.bottomView =
                    this.current.bottomView === view
                        ? this.current.topView
                        : this.current.bottomView
                this.current.topView = view
            } else {
                this.current.topView =
                    this.current.topView === view
                        ? this.current.bottomView
                        : this.current.topView
                this.current.bottomView = view
            }
        }
        this.log = log.getChildLogger(`[${toString(this.current)}]`)
        this.log.debug('new state')
        this.uiState$.next(this.current)
    }

    public getPresenterViewState(
        view: RenderViewName,
        additionalClasses = '',
    ): PresenterViewState {
        return new PresenterViewState(this.uiState$, view, additionalClasses)
    }

    public get features(): Features {
        return getFeatures()
    }
}

function toString(uiState: UiState): string {
    if (uiState.kind === 'mono') {
        return uiState.view
    } else {
        return `t:${uiState.topView}|b:${uiState.bottomView}`
    }
}
