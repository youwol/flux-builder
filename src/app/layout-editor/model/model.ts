/** @format */

import { Observable } from 'rxjs'
import { ContractModelComponent } from './'

export interface ContractModel {
    readonly activeComponent$: Observable<ContractModelComponent>
    readonly moduleIdSelected$: Observable<string>
    selectedModuleId: string
}

export type TypeDoc = 'css' | 'html'
