/** @format */
import CodeMirror from 'codemirror'
import { Observable } from 'rxjs'
import { PresenterPosition } from '.'

export type PresenterDoc = Readonly<IDoc>

interface IDoc {
    setCodeMirrorDoc(doc: CodeMirror.Doc): void
    content$: Observable<string>
    positions$: Observable<PresenterPosition[]>
    showModule$: Observable<string>
    showModule(moduleId: string): void
    showSelectedModule(): void
    change(content: string): void
    save(): void
    insert(): void
}
