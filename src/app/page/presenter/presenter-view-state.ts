/** @format */

import { Observable } from 'rxjs'
import { NumberPanes, RenderViewName, RenderViewPosition } from '../model'

export interface PresenterViewState {
    readonly state$: Observable<{
        position: RenderViewPosition
        numberPanes: NumberPanes
    }>
    close(): void
    change(renderViewName: RenderViewName): void
}
