/** @format */

import { AppStore } from '../../builder-editor/builder-state'

export function getJsRessources(appStore: AppStore) {
    return appStore.packages.reduce((acc, pack) => {
        const js = pack.requirements
            .filter((r) => r.type === 'javascript-external')
            .map((r) => r.src)
        return acc.concat(js)
    }, [])
}
