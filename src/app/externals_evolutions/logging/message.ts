/** @format */

import { PlaceHolderValue } from './logging'

export function v<T>(
    value: T,
    asString: (v: T) => string = (v) => v?.toString(),
): () => PlaceHolderValue {
    return () => {
        return {
            original: value,
            asString: () => asString(value),
        }
    }
}
