/** @format */

import { Observable } from 'rxjs'
import { ModelComponent } from './'

export interface ModelApp {
    readonly activeComponent$: Observable<ModelComponent>
    readonly moduleIdSelected$: Observable<string>
    moduleIdSelected: string
}

export type TypeDoc = 'css' | 'html'
