/** @format */

import { logFactory as parentLogFactor } from '@youwol/logging'

export function logFactory() {
    return parentLogFactor().getChildFactory('@youwol/flux-builder')
}
