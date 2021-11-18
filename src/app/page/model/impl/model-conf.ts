/** @format */

import { v } from '../../../externals_evolutions/logging'
import { Conf, Feature, logFactory, RenderViewName } from '..'

const log = logFactory().getChildLogger('ImplModelConf')

const defaultFeaturesParam = 'fg'
const defaultAltFeaturesParam = 'frx'

const oneLetterFeature = ['f', 'g', 'r', 'x', 't'] as const
type OneLetterFeature = typeof oneLetterFeature[number]

const oneLetterMapping: Record<OneLetterFeature, Feature> = {
    f: 'flow-builder',
    g: 'grapejs-editor',
    r: 'raw-editor',
    x: 'runner',
    t: 'three_panes',
}

function isOneLetterFeature(s: string): s is OneLetterFeature {
    return oneLetterFeature.includes(s as OneLetterFeature)
}

function featuresSetFromString(featuresParam: string): RenderViewName[] {
    const result: RenderViewName[] = []
    for (const letter of [...featuresParam]) {
        if (isOneLetterFeature(letter)) {
            const feature = oneLetterMapping[letter]
            if (feature === 'three_panes') {
                throw new Error('Three panes view not implemented')
            } else {
                result.push(feature)
            }
            log.debug('{0} => {1}', [v(letter), v(feature)])
        } else {
            log.warning('Unknown one letter feature : {0}', v(letter))
        }
    }
    return result
}

export function factoryConf(): Conf {
    const urlQueryParams = new URLSearchParams(document.location.search)
    log.debug('UrlQueryParams: "{0}"', v(urlQueryParams))
    const featuresParam = urlQueryParams.get('features') ?? defaultFeaturesParam
    log.debug('FeaturesParam : {0}', v(featuresParam))
    const altFeaturesParam =
        urlQueryParams.get('alt_features') ?? defaultAltFeaturesParam
    log.debug('AltFeaturesParam : {0}', v(altFeaturesParam))
    const features = featuresSetFromString(featuresParam)
    urlQueryParams.set('features', altFeaturesParam)
    urlQueryParams.set('alt_features', featuresParam)
    const altUrlQueryParams = urlQueryParams.toString()
    log.debug('altUrlQueryParams: "{0}"', v(altUrlQueryParams))
    return {
        initState: {
            kind: 'split',
            topView: features[0],
            bottomView: features[1],
        },
        defaultMono: {
            kind: 'mono',
            view: features[0],
        },
        defaultSplit: {
            kind: 'split',
            topView: features[0],
            bottomView: features[1],
        },
        defaultBottom: features[1],
        features: new Set(features),
        altUrlQueryParams,
    }
}
