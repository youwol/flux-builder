/** @format */

import { Features } from '../../model'

export function getFeatures(): Features {
    if (document.documentURI.endsWith('&layout-mode=raw')) {
        return 'raw'
    } else {
        return 'grapes'
    }
}
