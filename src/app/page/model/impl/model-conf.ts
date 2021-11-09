/** @format */

import { Features } from '../model-common'
import { Conf } from '../model-conf'
import { defaultMono, defaultSplitRawEditor, defaultSplitGrapesEditor } from './model-ui-state'

export function factoryConf(features: Features): Conf {
    return features === 'grapes'
        ? defaultsGrapesEditor
        : defaultsRawEditor
}

const defaultsRawEditor: Conf = {
    initState: defaultSplitRawEditor,
    defaultMono: defaultMono,
    defaultSplit: defaultSplitBeta,
    defaultBottom: 'editor',
}

const defaultsGrapesEditor: Conf = {
    initState: defaultSplitGrapesEditor,
    defaultMono: defaultMono,
    defaultSplit: defaultSplitGrapesEditor,
    defaultBottom: 'grapes-layout-editor',
}
