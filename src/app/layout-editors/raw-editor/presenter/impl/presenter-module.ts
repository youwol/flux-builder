/** @format */

import { ImmutableTree } from '@youwol/fv-tree'
import { ReplaySubject } from 'rxjs'
import {
    equal,
    ignore,
    logFactory,
    missing,
    PositionInDoc,
    PresenterPosition,
    PresenterTreeNode,
} from '..'
import { Logger, v } from '../../../../externals_evolutions/logging'
import { ModelModule, TypeDoc, TypeModule } from '../../model'

const log = logFactory().getChildFactory('Module')

export function factoryHierarchy(
    modelComponent: ModelModule,
    isRoot = false,
): ImplPresenterModule {
    const modelChildren = modelComponent.childrenContainingRendersView?.map(
        (model) => factoryHierarchy(model),
    )
    return new ImplPresenterModule(modelComponent, modelChildren, isRoot)
}

export class ImplPresenterModule
    extends ImmutableTree.Node
    implements PresenterTreeNode, PresenterPosition
{
    readonly log: Logger
    readonly id: string
    readonly typeModule: TypeModule
    readonly textualRepresentation$: ReplaySubject<string> = new ReplaySubject(
        1,
    )
    readonly currentPositionIn: {
        css: PositionInDoc
        html: PositionInDoc
    } = { css: undefined, html: undefined }

    readonly selected$: ReplaySubject<boolean> = new ReplaySubject()
    readonly positionIn: {
        readonly css$: ReplaySubject<PositionInDoc>
        readonly html$: ReplaySubject<PositionInDoc>
    }
    private isSelected = true

    constructor(
        private readonly modelModule: ModelModule,
        private readonly presentersChildren: ImplPresenterModule[],
        isRoot = false,
    ) {
        super({
            id: modelModule.id,
            children: presentersChildren,
        })
        this.log = log.getChildLogger(`[${modelModule.id}]`)

        this.id = modelModule.id
        this.typeModule = isRoot ? 'root' : modelModule.type
        this.textualRepresentation$.next(modelModule.title)
        this.positionIn = {
            css$: new ReplaySubject(1),
            html$: new ReplaySubject(1),
        }
        this.setPosition(
            'css',
            !isRoot && modelModule.hasRenderView ? missing : ignore,
        )
        this.setPosition(
            'html',
            !isRoot && modelModule.hasRenderView ? missing : ignore,
        )
        // this.selected$.next(false)
    }

    public set selected(selected: boolean) {
        if (this.isSelected != selected) {
            this.log.debug('set selected : {0}', v(selected))
            this.isSelected = selected
            this.selected$.next(selected)
        }
    }

    public select(): void {
        this.modelModule.select()
    }

    public setPosition(typeDoc: TypeDoc, position: PositionInDoc) {
        const _log = this.log.getChildLogger('setPosition')
        if (
            this.currentPositionIn[typeDoc] === undefined ||
            !equal(position, this.currentPositionIn[typeDoc])
        ) {
            _log.debug('setting position for {0}', v(typeDoc))
            this.currentPositionIn[typeDoc] = position
            this.positionIn[typeDoc + '$'].next(position)
        }
    }

    public getPositionIn(typeDoc: TypeDoc): PositionInDoc {
        return this.currentPositionIn[typeDoc]
    }

    public get descendantsHavingRenderView(): ImplPresenterModule[] {
        this.log.debug('Returning children for {0}', v(this.id))
        return [
            ...(this.presentersChildren ?? []),
            ...(this.presentersChildren?.flatMap(
                (child) => child.descendantsHavingRenderView ?? [],
            ) ?? []),
        ]
    }
}
