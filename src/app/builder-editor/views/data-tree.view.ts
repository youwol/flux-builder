import { ImmutableTree } from '@youwol/fv-tree'
import { BehaviorSubject, Observable, of } from 'rxjs'
import { map } from 'rxjs/operators'

export namespace DataTreeView {
    function nodeFactory(
        name: string,
        data: string | number | boolean | Array<any> | Object | undefined,
        nestedIndex: number,
    ): DataNode {
        if (data == undefined) {
            return new UndefinedNode({ name, nestedIndex })
        }

        if (typeof data == 'string') {
            return new StringNode({ name, data, nestedIndex })
        }

        if (typeof data == 'number') {
            return new NumberNode({ name, data, nestedIndex })
        }

        if (typeof data == 'boolean') {
            return new BoolNode({ name, data, nestedIndex })
        }

        if (typeof data == 'function') {
            return new FunctionNode({ name, data, nestedIndex })
        }

        if (Array.isArray(data)) {
            return new ArrayNode({ name, data, nestedIndex })
        }

        if (data instanceof ArrayBuffer) {
            return new ArrayBufferNode({ name, data, nestedIndex })
        }

        if (typeof data == 'object') {
            return new ObjectNode({ name, data, nestedIndex })
        }

        return new UnknownNode({ name, nestedIndex })
    }

    export class DataNode extends ImmutableTree.Node {
        name: string
        nestedIndex: number
        classes: string

        constructor({
            id,
            name,
            children,
            classes,
            nestedIndex,
        }: {
            id?: string
            name: string
            children?: Observable<Array<ImmutableTree.Node>>
            classes: string
            nestedIndex: number
        }) {
            super({ id: id ? id : `${name}_${nestedIndex}`, children }) // `${Math.floor(Math.random()*1e6)}`
            this.name = name
            this.classes = classes
            this.nestedIndex = nestedIndex
        }
    }

    export class UndefinedNode extends DataNode {
        constructor({
            name,
            nestedIndex,
            id,
        }: {
            name: string
            nestedIndex: number
            id?: string
        }) {
            super({ id, name, classes: 'fv-text-disabled', nestedIndex })
        }
    }

    export class UnknownNode extends DataNode {
        constructor({
            name,
            nestedIndex,
            id,
        }: {
            name: string
            nestedIndex: number
            id?: string
        }) {
            super({ id, name, classes: '', nestedIndex })
        }
    }

    export class ValueNode<T> extends DataNode {
        data: T
        classes: string

        constructor({
            name,
            data,
            classes,
            nestedIndex,
            id,
        }: {
            name: string
            data: T
            classes: string
            nestedIndex: number
            id?: string
        }) {
            super({ id, name, classes, nestedIndex })
            this.data = data
        }
    }

    export class NumberNode extends ValueNode<number> {
        constructor({
            name,
            data,
            nestedIndex,
            id,
        }: {
            name: string
            data: number
            nestedIndex: number
            id?: string
        }) {
            super({ id, name, data, classes: 'cm-number', nestedIndex })
        }
    }

    export class StringNode extends ValueNode<string> {
        constructor({
            name,
            data,
            nestedIndex,
            id,
        }: {
            name: string
            data: string
            nestedIndex: number
            id?: string
        }) {
            super({ id, name, data, classes: 'cm-string', nestedIndex })
        }
    }

    export class BoolNode extends ValueNode<boolean> {
        constructor({
            name,
            data,
            nestedIndex,
            id,
        }: {
            name: string
            data: boolean
            nestedIndex: number
            id?: string
        }) {
            super({ id, name, data, classes: 'cm-atom', nestedIndex })
        }
    }

    export class ArrayBufferNode extends ValueNode<ArrayBuffer> {
        constructor({
            name,
            data,
            nestedIndex,
            id,
        }: {
            name: string
            data: ArrayBuffer
            nestedIndex: number
            id?: string
        }) {
            super({ id, name, data, classes: 'cm-string', nestedIndex })
        }
    }

    export class FunctionNode extends DataNode {
        data: any
        constructor({
            name,
            data,
            nestedIndex,
            id,
        }: {
            name: string
            data: any
            nestedIndex
            id?: string
        }) {
            super({ id, name, classes: 'cm-def', nestedIndex })
            this.data = data
        }
    }

    export class ObjectNode extends DataNode {
        getChildrenNodes(object: Object) {
            const attributes = []
            for (const key in object) {
                attributes.push(
                    nodeFactory(key, object[key], this.nestedIndex + 1),
                )
            }
            let functions = []
            try {
                functions = Object.entries(object['__proto__']).map(
                    ([k, v]) =>
                        new FunctionNode({
                            name: k,
                            data: v,
                            nestedIndex: this.nestedIndex + 1,
                        }),
                )
            } catch (error) {}
            return [...attributes, ...functions]
        }

        data: Object
        constructor({
            name,
            data,
            nestedIndex,
            id,
        }: {
            name: string
            data: Object
            nestedIndex: number
            id?: string
        }) {
            super({
                id,
                name,
                children: of(data).pipe(
                    map((data) => this.getChildrenNodes(data)),
                ),
                classes: '',
                nestedIndex,
            })
            this.data = data
        }
    }

    export class ArrayNode extends DataNode {
        data: Array<any>
        constructor({
            name,
            data,
            nestedIndex,
            id,
        }: {
            name: string
            data: Array<any>
            nestedIndex: number
            id?: string
        }) {
            super({
                id,
                name,
                children: of(data).pipe(
                    map((data) =>
                        Object.entries(data).map(([k, v]) =>
                            nodeFactory(`${k}`, v, nestedIndex + 1),
                        ),
                    ),
                ),
                classes: '',
                nestedIndex,
            })
            this.data = data
        }
    }

    export class State extends ImmutableTree.State<DataNode> {
        public readonly stringLengthLimit

        constructor({
            title,
            data,
            expandedNodes,
            ...rest
        }: {
            title: string
            data: any
            expandedNodes?: Array<string> | BehaviorSubject<Array<string>>
        }) {
            super({
                rootNode: nodeFactory(title, data, 0),
                expandedNodes: expandedNodes,
                ...rest,
            })
        }
    }

    type TOptions = {
        stringLengthLimit?: number
        containerClass?: string
        containerStyle?: { [key: string]: string }
    }

    export class View extends ImmutableTree.View<DataNode> {
        static defaultOptions = {
            containerClass: 'cm-s-blackboard',
            containerStyle: { 'white-space': 'nowrap' },
        }

        static getStyling(options): TOptions {
            return { ...View.defaultOptions, ...(options ? options : {}) }
        }
        constructor({
            state,
            options,
            ...rest
        }: {
            state: State
            options?: TOptions
        }) {
            super({
                state,
                headerView: dataNodeHeaderView,
                class: View.getStyling(options).containerClass,
                style: View.getStyling(options).containerStyle,
                ...rest,
            } as any)
        }
    }

    export function dataNodeHeaderView(state: State, node: DataNode) {
        if (node instanceof UnknownNode) {
            return {
                class: 'd-flex fv-text-disabled flex-wrap',
                innerText: node.name,
            }
        }
        let content = ''
        if (node instanceof ValueNode) {
            content = String(node.data)
            if (typeof node.data == 'string') {
                content = "'" + content + "'"
            }
        }

        if (node instanceof UndefinedNode) {
            content = 'undefined'
        }

        if (node instanceof FunctionNode) {
            content = `f(${node.data.length} arg(s))`
        }

        if (node instanceof ObjectNode) {
            content = '{...}'
        }

        if (node instanceof ArrayNode) {
            content = '[...]'
        }

        if (node instanceof ArrayBufferNode) {
            content = `Array Buffer (${node.data.byteLength} bytes)`
        }

        return {
            class: 'd-flex fv-pointer',
            children: [
                {
                    innerText: node.name,
                },
                {
                    class: 'px-2 w-100 ' + node.classes,
                    innerHTML: `<i>${content}</i>`,
                    style: {
                        'white-space': 'nowrap',
                        overflow: 'hidden',
                        'text-overflow': 'ellipsis',
                        //"max-width": `${state.stringLengthLimit * 10}px`
                    },
                },
            ],
        }
    }
}
