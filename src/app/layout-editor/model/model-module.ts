/** @format */

export type TypeModule = 'root' | 'component' | 'group' | 'plugin' | 'module'

export interface ContractModelModule {
    readonly id: string
    readonly type: TypeModule
    readonly title: string
    readonly hasRenderView: boolean
    readonly childrenContainingRendersView: ContractModelModule[]
    select(): void
}
