import { createObservableFromFetch } from "@youwol/flux-core";
import { from, Observable, of } from "rxjs";
import { map, mergeMap, tap } from "rxjs/operators";
import { fetchBundles } from "@youwol/cdn-client"
import { AppStore } from "../builder-editor/builder-state";

export interface AssetResp {
    assetId: string
    name: string
}
export interface FolderResp {
    folderId: string
    name: string
}
export interface ItemResp {
    assetId: string;
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

    static appStore : AppStore = undefined
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
        let url = AssetsBrowserClient.urlBaseAssets + `/${assetId}`
        let request = new Request(url, { headers: AssetsBrowserClient.headers })
        return createObservableFromFetch(request)
    }

    static getFolderChildren$(folderId: string):
        Observable<ChildrenResp> {

        let url = `/api/assets-gateway/tree/folders/${folderId}/children`
        let request = new Request(url, { headers: AssetsBrowserClient.headers })
        return createObservableFromFetch(request)
    }

    static getGroupChildrenDrives$(groupId: string): Observable<DrivesResp> {

        let url = `/api/assets-gateway/tree/groups/${groupId}/drives`
        let request = new Request(url, { headers: AssetsBrowserClient.headers })

        return createObservableFromFetch(request)
    }

    static getGroupChildren$(pathParent = ""): Observable<GroupsResp> {
        
        let url = '/api/assets-gateway/groups'
        let request = new Request(url, { headers: AssetsBrowserClient.headers })
        let start$ = this.allGroups
            ? of(this.allGroups)
            : createObservableFromFetch(request).pipe(
                tap(({ groups }) => this.allGroups = groups),
                map(({ groups }) => groups)
            )
        return start$.pipe(
            mergeMap((allGroups: Array<{ id: string, path: string }>) => {

                let selectedGroups = allGroups
                .filter(grp => {
                    if (pathParent == "")
                        return grp.path == "private" || grp.path == "/youwol-users"
                    return grp.path != pathParent && grp.path.includes(pathParent) && (grp.path.slice(pathParent.length).match(/\//g)).length == 1
                })
                if(pathParent=="")
                    return of({groups:selectedGroups, drives:[], groupId: undefined});
                    
                let groupId = allGroups.find(g => g.path == pathParent).id
                return AssetsBrowserClient
                .getGroupChildrenDrives$(groupId)
                .pipe(
                    map(({ drives }) => {
                        return { groupId, groups:selectedGroups, drives }
                    })
                )
            })
        ) as any
    }

    static getModules$( rawId : string) {

        let url = `/api/assets-gateway/raw/package/metadata/${rawId}`
        let request = new Request(url, { headers: AssetsBrowserClient.headers }) 
                
        return createObservableFromFetch(request).pipe(
            mergeMap( (targetLibrary: any) => {

                if(window[targetLibrary.name])
                    return of({targetLibrary, loadingGraph:{lock:[], fluxPacks:[], libraries:{}}})

                let libraries = {
                    ...AssetsBrowserClient.appStore.project.requirements.libraries,
                    ...{[targetLibrary.name]:targetLibrary.versions[0]}
                } as {[key:string]: string}
                
                let fetchPromise = fetchBundles(libraries, window)
                
                return from(fetchPromise).pipe( map( (loadingGraph) => {
                    return {targetLibrary, loadingGraph}
                }) )
            }),
            map( ({targetLibrary, loadingGraph}) =>{
                let loaded = window[targetLibrary.name]
                return {
                    factories: Object.values(loaded).filter( (v:any) => v.Module && v.BuilderView),
                    library: targetLibrary,
                    loadingGraph
                }
            }),
        )
    }
}