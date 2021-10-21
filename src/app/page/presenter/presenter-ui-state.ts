/** @format */

import { ReplaySubject } from 'rxjs'
import { logFactory, v } from '../../externals_evolutions/logging'
import { Conf, RenderView, UiState } from './../model'
import { PresenterViewState } from './presenter-view-state'

const log = logFactory().getChildFactory('UiState')

export class PresenterUiState {
    private log = logFactory().getChildLogger('UiState')
    private current: UiState
    private readonly uiState$: ReplaySubject<UiState>
    public readonly splitted$: ReplaySubject<boolean>

    constructor(private readonly conf: Conf) {
        this.current = this.conf.initState
        this.uiState$ = new ReplaySubject(1)
        this.splitted$ = new ReplaySubject(1)
        this.uiState$.next(this.current)
        this.log = this.log.getChildLogger(toString(this.current))
        this.uiState$.next(this.current)
        this.splitted$.next(this.current.kind === 'split')
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
        this.log.debug('')
        this.uiState$.next(this.current)
        this.splitted$.next(this.current.kind === 'split')
    }

    public toggleView(view: RenderView, pos = 'top') {
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
        this.log = logFactory()
            .getChildLogger('UiState')
            .getChildLogger(toString(this.current))
        this.log.debug('')
        this.uiState$.next(this.current)
    }

    public getViewState(view: string, additionalClasses = '') {
        return new PresenterViewState(this.uiState$, view, additionalClasses)
    }
}

function toString(uiState: UiState): string {
    if (uiState.kind === 'mono') {
        return uiState.view
    } else {
        return `t:${uiState.topView}|b:${uiState.bottomView}`
    }
}

export type Features = 'main' | 'beta'
