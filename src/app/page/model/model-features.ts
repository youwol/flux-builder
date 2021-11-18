/** @format */

export type Feature = RenderViewName | 'three_panes'

export const rendersViewsNames = [
    'flow-builder',
    'raw-editor',
    'grapejs-editor',
    'runner',
] as const

export type RenderViewName = typeof rendersViewsNames[number]

export type RenderViewPosition = 'top' | 'bottom'
