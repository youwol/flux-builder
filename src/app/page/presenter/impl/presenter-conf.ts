/** @format */

import { Features } from '../../model'

export function getFeatures(): Features {
    const t = new URLSearchParams(document.location.search)
    if (t.get('features') == 'beta') {
        return 'beta'
    } else {
        return 'main'
    }
}
