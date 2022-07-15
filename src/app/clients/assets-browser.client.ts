/** @format */

import { createObservableFromFetch } from '@youwol/flux-core'
import { from, Observable, of } from 'rxjs'
import { map, mergeMap, tap } from 'rxjs/operators'
import { install } from '@youwol/cdn-client'
import { AppStore } from '../builder-editor/builder-state'

export interface AssetResp {
    assetId: string
    name: string
}

export interface FolderResp {
    folderId: string
    name: string
}

export interface ItemResp {
    assetId: string
    treeId: string
    rawId: string
    name: string
}
export interface DriveResp {
    driveId: string
    name: string
}
export interface GroupResp {
    id: string
    path: string
}
export interface ChildrenResp {
    items: Array<ItemResp>
    folders: Array<FolderResp>
}
export interface GroupsResp {
    groupId: string
    groups: Array<GroupResp>
    drives: Array<DriveResp>
}
export interface DrivesResp {
    drives: Array<DriveResp>
}

export class AssetsBrowserClient {
    static appStore: AppStore = undefined
    static tmpLibraries = undefined

    static urlBase = '/api/assets-gateway'
    static urlBaseOrganisation = '/api/assets-gateway/tree'
    static urlBaseAssets = '/api/assets-gateway/assets'
    static urlBaseRaws = '/api/assets-gateway/raw'

    static allGroups = undefined

    static headers: { [key: string]: string } = {}

    static setHeaders(headers: { [key: string]: string }) {
        AssetsBrowserClient.headers = headers
    }

    static getAsset$(assetId: string): Observable<AssetResp> {
        const url = AssetsBrowserClient.urlBaseAssets + `/${assetId}`
        const request = new Request(url, {
            headers: AssetsBrowserClient.headers,
        })
        return createObservableFromFetch(request)
    }

    static getFolderChildren$(folderId: string): Observable<ChildrenResp> {
        const url = `/api/assets-gateway/tree/folders/${folderId}/children`
        const request = new Request(url, {
            headers: AssetsBrowserClient.headers,
        })
        return createObservableFromFetch(request)
    }

    static getGroupChildrenDrives$(groupId: string): Observable<DrivesResp> {
        const url = `/api/assets-gateway/tree/groups/${groupId}/drives`
        const request = new Request(url, {
            headers: AssetsBrowserClient.headers,
        })

        return createObservableFromFetch(request)
    }

    static getGroupChildren$(pathParent = ''): Observable<GroupsResp> {
        const url = '/api/assets-gateway/groups'
        const request = new Request(url, {
            headers: AssetsBrowserClient.headers,
        })
        const start$ = this.allGroups
            ? of(this.allGroups)
            : createObservableFromFetch(request).pipe(
                  tap(({ groups }) => (this.allGroups = groups)),
                  map(({ groups }) => groups),
              )
        return start$.pipe(
            mergeMap((allGroups: Array<{ id: string; path: string }>) => {
                const selectedGroups = allGroups.filter((grp) => {
                    if (pathParent == '') {
                        return (
                            grp.path == 'private' || grp.path == '/youwol-users'
                        )
                    }
                    return (
                        grp.path != pathParent &&
                        grp.path.includes(pathParent) &&
                        grp.path.slice(pathParent.length).match(/\//g).length ==
                            1
                    )
                })
                if (pathParent == '') {
                    return of({
                        groups: selectedGroups,
                        drives: [],
                        groupId: undefined,
                    })
                }

                const groupId = allGroups.find((g) => g.path == pathParent).id
                return AssetsBrowserClient.getGroupChildrenDrives$(
                    groupId,
                ).pipe(
                    map(({ drives }) => {
                        return { groupId, groups: selectedGroups, drives }
                    }),
                )
            }),
        )
    }

    static getModules$(rawId: string) {
        const url = `/api/assets-gateway/raw/package/metadata/${rawId}`
        const request = new Request(url, {
            headers: AssetsBrowserClient.headers,
        })

        return createObservableFromFetch(request).pipe(
            mergeMap((targetLibrary: any) => {
                if (window[targetLibrary.name]) {
                    return of({
                        targetLibrary,
                        loadingGraph: {
                            lock: [],
                            fluxPacks: [],
                            libraries: {},
                        },
                    })
                }

                const libraries = {
                    ...AssetsBrowserClient.appStore.project.requirements
                        .libraries,
                    ...{ [targetLibrary.name]: targetLibrary.versions[0] },
                } as { [key: string]: string }

                const fetchPromise = install(
                    {
                        modules: Object.entries(libraries).map(([k, v]) => ({
                            name: k,
                            version: v,
                        })),
                    },
                    { executingWindow: window },
                )

                return from(fetchPromise).pipe(
                    map((loadingGraph) => {
                        return { targetLibrary, loadingGraph }
                    }),
                )
            }),
            map(({ targetLibrary, loadingGraph }) => {
                const loaded = window[targetLibrary.name]
                return {
                    factories: Object.values(loaded).filter(
                        (v: any) => v && v.Module && v.BuilderView,
                    ),
                    library: targetLibrary,
                    loadingGraph,
                }
            }),
        )
    }
}
