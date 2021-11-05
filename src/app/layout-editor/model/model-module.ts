/** @format */

export type TypeModule = 'root' | 'component' | 'group' | 'plugin' | 'module'

export interface ModelModule {
    readonly id: string
    readonly type: TypeModule
    readonly title: string
    readonly hasRenderView: boolean
    readonly childrenContainingRendersView: ModelModule[]
    select(): void
}
