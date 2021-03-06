/** @format */

export const privateClasses = [
    'flux-element',
    'flux-component',
    'flux-fill-parent',
    'd-flex',
    'flex-column',
]

export function cleanCss(css: string): string {
    const rules = [...new Set(css.split('}'))]
        .filter((r) => r.length > 0)
        .map((r) => r + '}')
    return rules.reduce((acc: string, e: string) => acc + e, '')
}

export function getAllComponentsRec(editor, component = undefined) {
    const getAllComponents = (model, result = []) => {
        result.push(model)
        model.components().each((mod) => getAllComponents(mod, result))
        return result
    }
    component = component || editor.DomComponents.getWrapper()
    const rList = getAllComponents(component)
    return rList.reduce((acc, e) => Object.assign({}, acc, { [e.ccid]: e }), {})
}

export function get_gjs_prefixes() {
    const projectId = new URLSearchParams(window.location.search).get('id')
    const common = `gjs-${projectId}-`
    return {
        common,
        html: `${common}html`,
        components: `${common}components`,
        css: `${common}css`,
        styles: `${common}styles`,
    }
}
