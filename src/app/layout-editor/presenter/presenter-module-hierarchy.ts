/** @format */
import { ImmutableTree } from '@youwol/fv-tree'
import { Observable } from 'rxjs'
import { TypeModule } from '../model'
import { PositionInDoc } from './'

export type ContractPresenterModuleHierarchy = Readonly<
    IContractModuleHierarchy & ImmutableTree.Node
>

export interface IContractModuleHierarchy extends ImmutableTree.Node {
    textualRepresentation$: Observable<string>
    id: string
    typeModule: TypeModule
    positionIn: {
        css$: Observable<PositionInDoc>
        html$: Observable<PositionInDoc>
    }
    selected$: Observable<boolean>
}
