/** @format */
import { PresenterDoc, PresenterTree } from '.'

export type PresenterComponent = Readonly<IPresenterComponent>

interface IPresenterComponent {
    css: PresenterDoc
    html: PresenterDoc
    presenterTree: PresenterTree
    unsubscribe(): void
}
