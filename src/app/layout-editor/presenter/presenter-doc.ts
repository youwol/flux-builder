/** @format */
import CodeMirror from 'codemirror'
import { Observable } from 'rxjs'
import { ContractPresenterModulePosition } from './'

export type ContractPresenterDoc = Readonly<IContractDoc>

export interface IContractDoc {
    content$: Observable<string>
    modulesPositions$: Observable<ContractPresenterModulePosition[]>
    onChange(content: string): void
    onSave(): void
    onInsert(doc: CodeMirror.Doc): void
}
