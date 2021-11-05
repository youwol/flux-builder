/** @format */
import { Observable } from 'rxjs'
import { TypeDoc, TypeModule } from '../model/'
import { PositionInDoc } from './'

export type PresenterPosition = Readonly<IPosition>

interface IPosition {
    textualRepresentation$: Observable<string>
    id: string
    typeModule: TypeModule
    selected$: Observable<boolean>
    getPositionIn<typeDoc>(typeDoc: TypeDoc): PositionInDoc
    select(): void
}
