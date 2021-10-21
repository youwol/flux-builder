/** @format */
import { Observable } from 'rxjs'
import { TypeDoc, TypeModule } from '../model/'
import { PositionInDoc } from './'

export type ContractPresenterModulePosition = Readonly<IContractModulePosition>

export interface IContractModulePosition {
    textualRepresentation$: Observable<string>
    id: string
    typeModule: TypeModule
    selected$: Observable<boolean>
    getPositionIn<typeDoc>(typeDoc: TypeDoc): PositionInDoc
    onSelect(): void
}
