/** @format */

import {
    Conf,
    Feature,
    logFactory,
    NumberPanes,
    RenderViewName,
    UiState,
} from '..'
import { ImplUiState } from './model-ui-state'

const log = logFactory().getChildLogger('ImplModelConf')

const defaultFeaturesParam = 'fg2'
const defaultAltFeaturesParam = 'frx3'

const oneLetterFeature = ['f', 'g', 'r', 'x', '1', '2', '3'] as const
type OneLetterFeature = (typeof oneLetterFeature)[number]

const oneLetterMapping: Record<OneLetterFeature, Feature> = {
    f: 'flow-builder',
    g: 'grapejs-editor',
    r: 'raw-editor',
    x: 'runner',
    1: 1,
    2: 2,
    3: 3,
}

function isOneLetterFeature(s: string): s is OneLetterFeature {
    return oneLetterFeature.includes(s as OneLetterFeature)
}

function featuresSetFromString(featuresParam: string): {
    availableRendersViews: RenderViewName[]
    initUiState: UiState
} {
    const availableRendersViews: RenderViewName[] = []
    let defaultNumberPanes: NumberPanes
    for (const letter of [...featuresParam]) {
        if (isOneLetterFeature(letter)) {
            const feature = oneLetterMapping[letter]
            if (feature === 3 || feature === 2 || feature === 1) {
                defaultNumberPanes = feature
            } else {
                availableRendersViews.push(feature)
            }
            log.debug('{0} => {1}', letter, feature)
        } else {
            log.warning('Unknown one letter feature : {0}', { value: letter })
        }
    }
    if (defaultNumberPanes === undefined) {
        defaultNumberPanes = 2
    }
    return {
        availableRendersViews,
        initUiState: new ImplUiState(availableRendersViews, defaultNumberPanes),
    }
}

export function factoryConf(): Conf {
    const urlQueryParams = new URLSearchParams(document.location.search)
    log.debug('UrlQueryParams: "{0}"', () => urlQueryParams.toString())
    const featuresParam = urlQueryParams.get('features') ?? defaultFeaturesParam
    log.debug('FeaturesParam : {0}', featuresParam)
    const altFeaturesParam =
        urlQueryParams.get('alt_features') ?? defaultAltFeaturesParam
    log.debug('AltFeaturesParam : {0}', altFeaturesParam)
    const features = featuresSetFromString(featuresParam)
    urlQueryParams.set('features', altFeaturesParam)
    urlQueryParams.set('alt_features', featuresParam)
    const altUrlQueryParams = urlQueryParams.toString()
    log.debug('altUrlQueryParams: "{0}"', altUrlQueryParams)
    return {
        altUrlQueryParams,
        ...features,
    }
}
