/** @format */

import { conf, Conf, confBeta } from '../model'
import { features } from './presenter-features'

export function getConf(): Conf {
    return features() === 'main' ? conf : confBeta
}
