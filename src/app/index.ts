/** @format */

import { logFactory as parentLogFactor } from './externals_evolutions/logging'

export function logFactory() {
    return parentLogFactor().getChildFactory('@youwol/flux-builder')
}
