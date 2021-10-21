/** @format */
import { Backend, CbPlaceHolder, CbsPlacesHolder, Level } from './logging'

export const backendConsole: Backend = {
    id: 'CONSOLE',
    logFn: (level, message, cb, context) => {
        const finalMessage = stringify(message, cb)
        const date = new Date().toISOString()
        const toConsole = `[${date}][${Level[level]}] ${context.name} : ${finalMessage}`

        switch (level) {
            case Level.DEBUG:
            case Level.INFO:
            case Level.NOTICE:
                console.log(toConsole)
                break
            case Level.WARNING:
                console.warn(message)
                break
            default:
                console.error(toConsole)
        }
    },
}

export function stringify(message: string, cb: CbsPlacesHolder) {
    let result = message
    let cbsPlacesHolder: CbPlaceHolder[]
    if (cb === undefined) {
        cbsPlacesHolder = []
    } else if (!Array.isArray(cb)) {
        cbsPlacesHolder = [cb]
    } else {
        cbsPlacesHolder = cb
    }
    cbsPlacesHolder
        .map((cbPlaceHolder: CbPlaceHolder) => cbPlaceHolder().asString())
        .forEach(
            (target, placeholder) =>
                (result = result.replace(`{${placeholder}}`, target)),
        )
    return result
}

export const backendAlert: Backend = {
    id: 'ALERT',
    logFn: (level, message, cb, context) => {
        const finalMessage = stringify(message, cb)
        alert(`${context.name} says « ${finalMessage} »`)
    },
}
