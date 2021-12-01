/** @format */

import {
    logFactory,
    NumberPanes,
    RenderViewName,
    RenderViewPosition,
    UiState,
} from '..'

const log = logFactory().getChildLogger('ImplModelUiState')

export class ImplUiState implements UiState {
    private readonly current: RenderViewName[] = []

    constructor(
        private readonly availableViewsNames: RenderViewName[],
        initNumberPanes: NumberPanes,
    ) {
        this.fillDisposition(initNumberPanes)
    }

    getPosition(renderViewName: RenderViewName): RenderViewPosition {
        log.debug('Get position for {0}', renderViewName)
        switch (this.current.indexOf(renderViewName)) {
            case 0:
                return 'top'
            case 1:
                return 'middle'
            case 2:
                return 'bottom'
            default:
                return 'none'
        }
    }

    removeRenderView(renderViewName: RenderViewName): void {
        log.debug('Remove {0}', renderViewName)
        const renderIndex = this.current.indexOf(renderViewName)
        if (renderIndex < 0) {
            throw new Error(
                `Render view ${renderViewName} not in current disposition`,
            )
        }
        this.current.splice(renderIndex, 1)
        log.debug('final list : {0}', this.current)
    }

    switchRenderView(
        currentRenderView: RenderViewName,
        otherRenderView: RenderViewName,
    ): void {
        log.debug(
            'switch {0} to {1}',
            { value: currentRenderView },
            { value: otherRenderView },
        )
        const currentIndex = this.current.indexOf(currentRenderView)
        const otherIndex = this.current.indexOf(otherRenderView)
        if (currentIndex < 0) {
            throw new Error(
                `Render view ${currentRenderView} not in current disposition`,
            )
        }
        this.current[currentIndex] = otherRenderView
        if (otherIndex >= 0) {
            this.current[otherIndex] = currentRenderView
        }
        log.debug('final list : {0}', this.current)
    }

    set numberPanes(numberPane: NumberPanes) {
        log.debug('set number of panes to {0}', numberPane)
        this.fillDisposition(numberPane)
        this.current.splice(numberPane)
        log.debug('final list : {0}', this.current)
    }

    get numberPanes(): NumberPanes {
        switch (this.current.length) {
            case 1:
                return 1
            case 2:
                return 2
            case 3:
                return 3
            default:
                throw new Error()
        }
    }

    private fillDisposition(numberPane: NumberPanes): void {
        log.debug('fill list with {0} panes', numberPane)
        let defaultRenderViewIndex = 0
        for (
            let id = this.current.length;
            id < numberPane && id < this.availableViewsNames.length;
            id++
        ) {
            let candidateRenderView =
                this.availableViewsNames[defaultRenderViewIndex]
            log.debug(
                'testing {2} (default {0}) for position {1}',
                { value: defaultRenderViewIndex },
                { value: id },
                { value: candidateRenderView },
            )
            while (this.current.includes(candidateRenderView)) {
                log.debug('candidate {0} already in list', candidateRenderView)
                candidateRenderView =
                    this.availableViewsNames[++defaultRenderViewIndex]
            }
            log.debug(
                'inserting {0} at {1}',
                { value: candidateRenderView },
                { value: id },
            )
            this.current[id] = candidateRenderView
        }
        log.debug('final list : {0}', this.current)
    }
}
