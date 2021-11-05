/** @format */

import { Observable } from 'rxjs'
import { ViewState } from '../model'

export interface PresenterViewState {
    readonly state$: Observable<ViewState>
}
