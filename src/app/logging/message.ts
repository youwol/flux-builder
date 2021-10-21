/** @format */

import { PlaceHolderValue } from './logging'

export function placeHolderValue<T>(
  value: T,
  asString: (v: T) => string = (v) => v.toString(),
): () => PlaceHolderValue {
  return () => {
    return {
      original: value,
      asString: () => asString(value),
    }
  }
}
