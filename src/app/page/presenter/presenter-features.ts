/** @format */

import { Features } from './presenter-ui-state'

export function features(): Features {
    if (document.documentURI.endsWith('&features=beta')) {
        return 'beta'
    } else {
        return 'main'
    }
}
