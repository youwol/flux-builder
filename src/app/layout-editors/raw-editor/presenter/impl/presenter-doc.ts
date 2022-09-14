/** @format */
import { Logger } from '@youwol/logging'
import CodeMirror from 'codemirror'
import { css, html } from 'js-beautify'
import { ReplaySubject } from 'rxjs'
import { ModelComponent, TypeDoc } from '../../model'
import {
    ignore,
    logFactory,
    missing,
    PositionInDoc,
    present,
    PresenterDoc,
    PresenterPosition,
    TypeInDoc,
} from '..'
import { ImplPresenterComponent } from './presenter-component'
import { ImplPresenterModule } from './presenter-module'

const log = logFactory().getChildFactory('Doc')

export class ImplPresenterDoc<typeDoc extends TypeDoc> implements PresenterDoc {
    private log: Logger
    modelComponent: ModelComponent
    currentContent: string
    private codeMirrorDoc: CodeMirror.Doc

    content$: ReplaySubject<string> = new ReplaySubject(1)
    positions$: ReplaySubject<PresenterPosition[]> = new ReplaySubject(1)
    showModule$: ReplaySubject<string> = new ReplaySubject(1)

    constructor(
        private readonly typeDoc: typeDoc,
        private readonly presenter: ImplPresenterComponent,
    ) {
        this.log = log.getChildLogger(`${this.typeDoc}`)
    }

    public setCodeMirrorDoc(doc: CodeMirror.Doc) {
        this.codeMirrorDoc = doc
    }

    public showSelectedModule() {
        this.showModule(this.getSelectedId('present'))
    }

    public showModule(moduleId: string) {
        if (moduleId !== undefined) {
            this.log.debug('showing module {0}', moduleId)
            this.showModule$.next(moduleId)
        }
    }

    public insert(): void {
        const _log = this.log.getChildLogger('onInsert')
        if (this.codeMirrorDoc === undefined) {
            throw new Error('insert called without codeMirrorDoc configured')
        }
        const id = this.getSelectedId('missing')
        if (id !== undefined) {
            _log.debug('Inserting id {0}', { value: id })
            insertModuleId[this.typeDoc](id, this.codeMirrorDoc)
        } else {
            _log.debug('Selected id not missing in doc')
        }
    }

    private getSelectedId(typeInDoc: TypeInDoc) {
        const selectedId = this.presenter.modelApp.moduleIdSelected
        this.log.debug(
            'considering selectedId {0} with typeInDoc {1}',
            selectedId,
            typeInDoc,
        )
        return this.presenter.modules.find(
            (mdle) =>
                mdle.id === selectedId &&
                mdle.getPositionIn(this.typeDoc).typeInDoc === typeInDoc,
        )?.id
    }

    public save(): void {
        if (this.typeDoc === 'css') {
            this.modelComponent.contentCss = this.currentContent
        } else {
            this.modelComponent.contentHtml = this.currentContent
        }
    }

    public loadComponentContent(modelComponent: ModelComponent): void {
        this.modelComponent = modelComponent
        this.log = log.getChildLogger(`[${this.typeDoc}][${modelComponent.id}]`)
        this.currentContent = formatContent[this.typeDoc](this.modelComponent)
        this.content$.next(this.currentContent)
    }

    public change(content: string): void {
        const _log = this.log.getChildLogger('onChange')
        this.currentContent = content
        this.presenter.modules
            .filter((mdle) => mdle.getPositionIn(this.typeDoc) !== ignore)
            .forEach((mdle) => {
                const modulePosition = this.findModulePosition(mdle)
                _log.debug('module {0} is not ignored', { value: mdle.id })
                mdle.setPosition(this.typeDoc, modulePosition)
            })
        this.positions$.next(
            this.presenter.modules.filter(
                (mdle) => mdle.getPositionIn(this.typeDoc) !== ignore,
            ),
        )
    }

    private findModulePosition(mdle: ImplPresenterModule): PositionInDoc {
        const searchString: string = searchStringForTypeDoc[this.typeDoc](
            mdle.id,
        )
        const searchStringLength: number = searchString.length
        const startAt = this.currentContent.search(searchString)
        return startAt < 0
            ? missing
            : present({
                  indexStart: startAt,
                  indexEnd: startAt + searchStringLength,
              })
    }
}

const searchStringForTypeDoc: Record<TypeDoc, (content: string) => string> = {
    css: (id: string): string => `#${id}`,
    html: (id: string): string => `id="${id}"`,
}

const insertModuleId: Record<
    TypeDoc,
    (moduleId: string, doc: CodeMirror.Doc) => void
> = {
    css: (moduleId: string, doc: CodeMirror.Doc): void =>
        doc.replaceRange(`#${moduleId} {\n}\n`, doc.getCursor()),
    html: (moduleId: string, doc: CodeMirror.Doc): void =>
        doc.replaceRange(
            `<div id="${moduleId}" class="flux-element"></div>\n`,
            doc.getCursor(),
        ),
}

const formatContent: Record<
    TypeDoc,
    (modelComponent: ModelComponent) => string
> = {
    css: (modelComponent) => css(modelComponent.contentCss),
    html: (modelComponent) => html(modelComponent.contentHtml),
}
