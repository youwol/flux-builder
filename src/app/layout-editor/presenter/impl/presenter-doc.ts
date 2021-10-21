/** @format */

import CodeMirror from 'codemirror'
import js_beautify from 'js-beautify'
import { ReplaySubject } from 'rxjs'
import {
    ContractPresenterDoc,
    ContractPresenterModulePosition,
    ignore,
    logFactory,
    missing,
    PositionInDoc,
    present,
} from '../'
import { v } from '../../../externals_evolutions/logging'
import { ContractModelComponent, TypeDoc } from '../../model'

import { Presenter } from './presenter'
import { PresenterModule } from './presenter-module'

export class PresenterDoc<typeDoc extends TypeDoc>
    implements ContractPresenterDoc
{
    private log
    modelComponent: ContractModelComponent
    currentContent: string

    content$: ReplaySubject<string> = new ReplaySubject(1)
    modulesPositions$: ReplaySubject<ContractPresenterModulePosition[]> =
        new ReplaySubject(1)

    constructor(
        private readonly typeDoc: typeDoc,
        private readonly presenter: Presenter,
    ) {
        this.log = logFactory().getChildFactory('Doc_' + this.typeDoc)
    }

    public onInsert(doc: CodeMirror.Doc): void {
        const _log = this.log.getChildLogger('onInsert')
        const selectedId = this.presenter.selectedModuleId
        _log.debug('considering selectedId {0} for insertion', v(selectedId))
        const id = this.presenter.modules.find(
            (mdle) =>
                mdle.id === selectedId &&
                mdle.getPositionIn(this.typeDoc) === missing,
        )?.id
        if (id !== undefined) {
            _log.debug('Inserting id {0}', v(id))
            insertModuleId[this.typeDoc](id, doc)
        } else {
            _log.debug('Not Inserting id {0}', v(selectedId))
        }
    }
    public onSave(): void {
        if (this.typeDoc === 'css') {
            this.modelComponent.contentCss = this.currentContent
        } else {
            this.modelComponent.contentHtml = this.currentContent
        }
    }

    public loadComponentContent(modelComponent: ContractModelComponent): void {
        this.modelComponent = modelComponent
        this.log = logFactory()
            .getChildLogger('Doc_' + this.typeDoc)
            .getChildLogger(`[${modelComponent.id}]`)
        this.content$.next(
            formatContent[this.typeDoc](
                this.typeDoc === 'css'
                    ? this.modelComponent.contentCss
                    : this.modelComponent.contentHtml,
            ),
        )
    }

    public onChange(content: string): void {
        const _log = this.log.getChildLogger('onChange')
        this.currentContent = content
        this.presenter.modules
            .filter((mdle) => mdle.getPositionIn(this.typeDoc) !== ignore)
            .forEach((mdle) => {
                const modulePosition = this.findModulePosition(mdle)
                _log.debug('module {0} is not ignored', v(mdle.id))
                mdle.setPosition(this.typeDoc, modulePosition)
            })
        this.modulesPositions$.next(
            this.presenter.modules.filter(
                (mdle) => mdle.getPositionIn(this.typeDoc) !== ignore,
            ),
        )
    }

    private findModulePosition(mdle: PresenterModule): PositionInDoc {
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

const searchStringForTypeDoc = {
    css: (id: string): string => `#${id}`,
    html: (id: string): string => `id="${id}"`,
}

const insertModuleId = {
    css: (moduleId: string, doc: CodeMirror.Doc): void =>
        doc.replaceRange(`#${moduleId} {\n}`, doc.getCursor()),
    html: (moduleId: string, doc: CodeMirror.Doc): void =>
        doc.replaceRange(
            `<div id="${moduleId}" class="flux-element"></div>`,
            doc.getCursor(),
        ),
}

const formatContent = {
    css: (content: string) => js_beautify.css_beautify(content),
    html: (content: string) => js_beautify.html_beautify(content),
}
