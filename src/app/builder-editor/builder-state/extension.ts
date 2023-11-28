import { AppStore } from './app-store'

export class BuilderStateAPI {
    static appStore: AppStore

    static initialize(appStore: AppStore) {
        BuilderStateAPI.appStore = appStore
    }
}
