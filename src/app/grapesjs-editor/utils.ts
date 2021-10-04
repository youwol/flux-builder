
declare var _: any

export let privateClasses = ["flux-element", "flux-component", "flux-fill-parent", "d-flex", "flex-column"]

export function cleanCss(css: string): string {
    let rules = [...new Set(css.split("}"))].filter(r => r.length > 0).map(r => r + "}")
    return rules.reduce((acc: string, e: string) => acc + e, "")
}

export function getAllComponentsRec(editor, component = undefined) {

    const getAllComponents = (model, result = []) => {

        result.push(model);
        model.components().each(mod => getAllComponents(mod, result))
        return result;
    }
    component = component || editor.DomComponents.getWrapper()
    let rList = getAllComponents(component);
    return rList.reduce((acc, e) => Object.assign({}, acc, { [e.ccid]: e }), {})
}
