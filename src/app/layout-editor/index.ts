/** @format */

import { logFactory as parentLogFactory } from '../externals_evolutions/logging'

export const logFactory = parentLogFactory().getChildFactory('layout-editor')
