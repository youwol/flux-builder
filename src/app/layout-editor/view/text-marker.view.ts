/** @format */
import CodeMirror, { TextMarker } from 'codemirror'
import { Subscription } from 'rxjs'
import { TypeDoc } from '../model'
import { isPresent, PresenterPosition } from '../presenter'
import { logFactory } from './'
import { IconForTypeModule } from './icon-for-type-module.view'

const log = logFactory().getChildFactory('TextMarker')

export const markDocument =
    (
        typeDoc: TypeDoc,
        cmEditor: CodeMirror.Editor,
        marksSubscriptions: Subscription[],
    ) =>
    (modulesPositions: PresenterPosition[]) => {
        marksSubscriptions.forEach((subscription) => subscription.unsubscribe())
        cmEditor
            .getDoc()
            .getAllMarks()
            .forEach((mark) => mark.clear())
        modulesPositions.forEach((modulePosition) => {
            const position = modulePosition.getPositionIn(typeDoc)
            if (isPresent(position)) {
                const htmlSpanElement = factoryTextMarker(
                    modulePosition,
                    marksSubscriptions,
                )
                const mark = cmEditor
                    .getDoc()
                    .markText(
                        cmEditor.getDoc().posFromIndex(position.indexStart),
                        cmEditor.getDoc().posFromIndex(position.indexEnd),
                        {
                            replacedWith: htmlSpanElement,
                        },
                    )
                marksSubscriptions.push(
                    modulePosition.selected$.subscribe((selected) => {
                        selected
                            ? focusElement(mark, cmEditor)
                            : unfocusElement(htmlSpanElement)
                    }),
                )
            }
        })
    }

const factoryTextMarker = (
    presenterModule: PresenterPosition,
    subscriptions: Subscription[],
): HTMLSpanElement => {
    const element = document.createElement('span')
    const elementIcon = document.createElement('span')
    const elementText = document.createElement('span')

    elementIcon.className = IconForTypeModule[presenterModule.typeModule]
        ? `mr-2 fas ${IconForTypeModule[presenterModule.typeModule]}`
        : ''

    elementText.innerText = ''
    element.className = 'fv-pointer fv-text-primary'
    element.setAttribute('style', 'text-decoration: underline')
    element.append(elementIcon, elementText)
    element.onclick = () => presenterModule.select()

    subscriptions.push(
        presenterModule.textualRepresentation$.subscribe(
            (textualRepresentation) => {
                elementText.innerText = textualRepresentation
            },
        ),
    )

    return element
    // return render({
    //   tag: 'span',
    //   style: {
    //     textDecoration: 'underline',
    //   } as CSSStyleDeclaration,
    //   onclick: args.callback,
    //   children: [
    //     {
    //       tag: 'span',
    //       class: 'mx-2 fas fa-object-group',
    //     },
    //     {
    //       tag: 'span',
    //       innerText: args.text,
    //     },
    //   ],
    // })
}

export function focusElement(marker: TextMarker, _cmEditor: CodeMirror.Editor) {
    const _log = log.getChildLogger('focus')
    if (marker === undefined) {
        _log.debug('marker is undefined')
        return
    }
    const element = marker.replacedWith
    const currentClasses = element.className.split(' ')
    if (
        currentClasses.find((className) => className === 'fv-text-focus') ===
        undefined
    ) {
        currentClasses.push('fv-text-focus')
        element.className = currentClasses.join(' ')
        _log.debug('Focus !')
        // cmEditor.scrollIntoView(marker.find(), 250)
    }
}

export function unfocusElement(element: HTMLSpanElement) {
    const _log = log.getChildLogger('unfocus')
    if (element === undefined) {
        _log.debug('marker is undefined')
        return
    }
    const currentClasses = element.className.split(' ')
    const idx = currentClasses.findIndex(
        (className) => className === 'fv-text-focus',
    )
    if (idx >= 0) {
        currentClasses.splice(idx, 1)
        element.className = currentClasses.join(' ')
    }
}
