/** @format */

export type PositionInDoc = Readonly<
    IPositionInDocPresent | IPositionMissing | IPositionIgnore
>
export type PositionInDocPresent = Readonly<IPositionInDocPresent>

export type TypeInDoc = 'missing' | 'present' | 'ignore'

export const missing: PositionInDoc = { typeInDoc: 'missing' }

export const ignore: PositionInDoc = { typeInDoc: 'ignore' }

export function present(position: {
    indexStart
    indexEnd
}): PositionInDocPresent {
    return {
        typeInDoc: 'present',
        ...position,
    }
}

export interface IPositionIgnore extends IPositionInDoc {
    typeInDoc: 'ignore'
}
export interface IPositionMissing extends IPositionInDoc {
    typeInDoc: 'missing'
}

export interface IPositionInDoc {
    typeInDoc: TypeInDoc
}

export interface IPositionInDocPresent extends IPositionInDoc {
    typeInDoc: 'present'
    indexStart: number
    indexEnd: number
}

export function isPresent(
    position: PositionInDoc,
): position is IPositionInDocPresent {
    return position.typeInDoc === 'present'
}

export function equal(a: PositionInDoc, b: PositionInDoc): boolean {
    if (a.typeInDoc !== b.typeInDoc) {
        return false
    }

    if (a.typeInDoc === 'present' && b.typeInDoc === 'present') {
        return a.indexStart === b.indexStart && a.indexEnd === b.indexEnd
    }

    return true
}
