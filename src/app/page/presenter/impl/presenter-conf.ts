/** @format */

import { Features } from '../../model'

export function getFeatures(): Features {
    if (document.documentURI.endsWith('&features=beta')) {
        return 'beta'
    } else {
        return 'main'
    }
}
