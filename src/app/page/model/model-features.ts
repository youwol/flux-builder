/** @format */
import { NumberPanes } from './model-ui-state'

export type Feature = RenderViewName | NumberPanes

export const rendersViewsNames = [
    'flow-builder',
    'raw-editor',
    'grapejs-editor',
    'runner',
] as const

export type RenderViewName = typeof rendersViewsNames[number]
