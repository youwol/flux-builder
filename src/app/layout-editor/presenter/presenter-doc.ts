/** @format */
import CodeMirror from 'codemirror'
import { Observable } from 'rxjs'
import { PresenterPosition } from '.'

export type PresenterDoc = Readonly<IDoc>

interface IDoc {
    content$: Observable<string>
    positions$: Observable<PresenterPosition[]>
    change(content: string): void
    save(): void
    insert(doc: CodeMirror.Doc): void
}
