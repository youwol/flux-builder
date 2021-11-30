/** @format */

import CodeMirror from 'codemirror'
import js_beautify from 'js-beautify'
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
} from '..'
import { ImplPresenterComponent } from './presenter-component'
import { ImplPresenterModule } from './presenter-module'

const log = logFactory().getChildFactory('Doc')

export class ImplPresenterDoc<typeDoc extends TypeDoc> implements PresenterDoc {
    private log
    modelComponent: ModelComponent
    currentContent: string

    content$: ReplaySubject<string> = new ReplaySubject(1)
    positions$: ReplaySubject<PresenterPosition[]> = new ReplaySubject(1)

    constructor(
        private readonly typeDoc: typeDoc,
        private readonly presenter: ImplPresenterComponent,
    ) {
        this.log = log.getChildLogger(`${this.typeDoc}`)
    }

    public insert(doc: CodeMirror.Doc): void {
        const _log = this.log.getChildLogger('onInsert')
        const selectedId = this.presenter.modelApp.moduleIdSelected
        _log.debug('considering selectedId {0} for insertion', {
            value: selectedId,
        })
        const id = this.presenter.modules.find(
            (mdle) =>
                mdle.id === selectedId &&
                mdle.getPositionIn(this.typeDoc) === missing,
        )?.id
        if (id !== undefined) {
            _log.debug('Inserting id {0}', { value: id })
            insertModuleId[this.typeDoc](id, doc)
        } else {
            _log.debug('Not Inserting id {0}', { value: selectedId })
        }
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
        doc.replaceRange(`#${moduleId} {\n}`, doc.getCursor()),
    html: (moduleId: string, doc: CodeMirror.Doc): void =>
        doc.replaceRange(
            `<div id="${moduleId}" class="flux-element"></div>`,
            doc.getCursor(),
        ),
}

const formatContent: Record<
    TypeDoc,
    (modelComponent: ModelComponent) => string
> = {
    css: (modelComponent) =>
        js_beautify.css_beautify(modelComponent.contentCss),
    html: (modelComponent) =>
        js_beautify.html_beautify(modelComponent.contentHtml),
}
