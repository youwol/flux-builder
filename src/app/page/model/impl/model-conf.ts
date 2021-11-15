/** @format */

import { Features } from '../model-common'
import { Conf } from '../model-conf'
import { defaultMono, defaultSplit, defaultSplitBeta } from './model-ui-state'

export function factoryConf(features: Features): Conf {
    return features === 'main' ? defaults : defaultsBeta
}

const defaultsBeta: Conf = {
    initState: defaultSplitBeta,
    defaultMono: defaultMono,
    defaultSplit: defaultSplitBeta,
    defaultBottom: 'raw-editor',
}

const defaults: Conf = {
    initState: defaultSplit,
    defaultMono: defaultMono,
    defaultSplit: defaultSplit,
    defaultBottom: 'grapejs-editor',
}
