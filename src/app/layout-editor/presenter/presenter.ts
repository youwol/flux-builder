/** @format */
import { ContractPresenterDoc, ContractPresenterTree } from './'

export type ContractPresenter = Readonly<IContractPresenter>

export interface IContractPresenter {
    css: ContractPresenterDoc
    html: ContractPresenterDoc
    presenterTree: ContractPresenterTree
    unsubscribe(): void
}
