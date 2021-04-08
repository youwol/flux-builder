import { Factory, uuidv4 } from "@youwol/flux-core"
import { attr$, child$ } from "@youwol/flux-view"
import { ImmutableTree } from "@youwol/fv-tree"
import { BehaviorSubject, Observable, of, Subject } from "rxjs"
import { map, scan, tap } from "rxjs/operators"
import { AssetsBrowserClient, ChildrenResp, GroupsResp } from "../../clients/assets-browser.client"
import { AppStore } from "../builder-state"


export namespace AssetsExplorerView{

    export let singletonState : State

    export class State extends ImmutableTree.State<ExplorerTreeNode>{

        // expandedNodes = ['exporer']
        public readonly appStore : AppStore

        public selectionBuffer$ : Observable<Array<ModuleItemNode>>

        public readonly selection$ : Subject<{node:ModuleItemNode, selected: boolean}>        
        static readonly favorites$ = new BehaviorSubject<Array<Favorite>>(getStoredFavorites())
        
        public readonly favorites = new Array<any>()

        constructor({
            appStore,
            selectionBuffer$
        }:{
            appStore: AppStore,
            selectionBuffer$?: Observable<Array<ModuleItemNode>>
        }) {
            super({
                rootNode: new RootNode( {favorites:State.favorites$.getValue()})
            })
            this.appStore = appStore
            this.selectionBuffer$ = selectionBuffer$ 
                ? selectionBuffer$ 
                : of([])

            State.favorites$.subscribe( favorites => {
                localStorage.setItem('flux-builder#favorites', JSON.stringify(favorites))
            })
            this.selection$ = new Subject<{node:ModuleItemNode, selected: boolean}>()
            //this.clearBuffer()
        }


        toggleFavorite(node: ExplorerTreeNode){

            let favorites = getStoredFavorites()
            let originalId = node instanceof FavoriteNode ? node.favorite.id : node.id
            if(favorites.find( f => f.id == originalId)){
                favorites = favorites.filter( favorite => favorite.id != originalId)
                State.favorites$.next(favorites)
                this.removeNode(node instanceof FavoriteNode ? node.id : "favorite_"+originalId)
                return 
            }
            let favorite =  new Favorite(originalId, node.name, node.type)
            favorites = favorites.concat([favorite])
            State.favorites$.next(favorites)
            this.addChild('explorer', new FavoriteNode({favorite}))
        }
    }


    export class View extends ImmutableTree.View<ExplorerTreeNode>{

        constructor({state,...rest}: {
            state: State
        }){
            super({
                state,
                headerView,
                ...rest
            })
        }
    }


    function headerView(state: State, node: ExplorerTreeNode) {

        if( !(node instanceof ModuleItemNode)){
            let favoriteClassBase = 'fas fa-star fa-xs fv-hover-opacity fv-pointer '
            return {
                class: 'd-flex w-100 align-items-center fv-pointer',
                children: [
                    { 
                        tag: 'i', 
                        class: node.faIcon ? node.faIcon : "" 
                    },
                    node instanceof FavoriteNode 
                        ?{ 
                            tag: 'i', class: 'fas fa-star fa-xs px-1 fv-text-focus fv-hover-opacity',
                            onclick: (ev) => { ev.stopPropagation(); state.toggleFavorite(node)}
                        }
                        :{}, 
                    { 
                        tag: 'span', 
                        class: 'mx-2', 
                        innerText: node.name, 
                        style: { 'user-select': 'none' } 
                    },
                    node instanceof AssetFolderNode
                        ? { 
                            tag:'i',
                            class: attr$(
                                State.favorites$,
                                (favorites) =>  favorites.find( f => f.id ==node.id)
                                    ? favoriteClassBase + "fv-text-focus" 
                                    : favoriteClassBase + "fv-text-primary" 
                            ),
                            onclick: (ev)=> {
                                ev.stopPropagation();
                                state.toggleFavorite(node)
                            }
                        }
                        : {},
                    child$(
                        node.status$,
                        (statusList) => statusList.find(status => status.type == 'request-pending')
                            ? { tag: 'i', class: 'fas fa-spinner fa-spin' }
                            : {}
                    )
                ]
            }
        }
        if( node instanceof ModuleItemNode){
            return {
                class: 'd-flex w-100 align-items-baseline fv-pointer',            
                onclick: () => state.selection$.next({node:node, selected: true}), 
                children: [
                    { 
                        tag:'i', 
                        class: attr$(
                            state.selectionBuffer$,
                            (buffer: Array<ModuleItemNode>) => buffer.includes(node) ? 'fv-text-focus': '',
                            { wrapper: (d) => 'fas fa-cloud-download-alt fv-text-primary fv-hover-opacity '+d}
                        )
                    },
                    { 
                        tag: 'span', 
                        class: 'mx-2 w-100', 
                        innerText: node.name, 
                        style: { 'user-select': 'none' } 
                    }
                ]
            } 
        }
    }

    type TChildren = Array<ExplorerTreeNode> | Observable<Array<ExplorerTreeNode>>

    class ExplorerTreeNode extends ImmutableTree.Node {

        public readonly faIcon: string
        public readonly name: string
        public readonly type: string
        public readonly status$ = new BehaviorSubject< Array<{type: string, id: string}>>([])

        constructor({ id, name, children, type, faIcon }: {
            id: string, 
            name: string, 
            type:string,
            children?: TChildren, 
            faIcon?: string
        }) {
            super({ id, children })
            this.name = name
            this.faIcon = faIcon
            this.type = type
        }

        addStatus({type, id} : {type:string, id?: string}){
            id = id || this.id
            let newStatus = this.status$.getValue().concat({type,id})
            this.status$.next(newStatus)
        }

        removeStatus({type, id} : {type:string, id?: string}){
            id = id || this.id
            let newStatus = this.status$.getValue().filter( s => s.type!=type && s.id!=id)
            this.status$.next(newStatus)
        }

        resolveChildren() : Observable<Array<ExplorerTreeNode>> {
            if(!this.children || Array.isArray(this.children))
                return
            
            let uid = uuidv4()
            this.addStatus( {type:'request-pending', id:uid })
            return super.resolveChildren().pipe(
                tap(() => {
                    this.removeStatus( {type:'request-pending', id:uid })
                })
            ) as Observable<Array<ExplorerTreeNode>>
        }
    }


    class FolderNode extends ExplorerTreeNode {

        constructor({ id, name, type, children, faIcon }: {
            id: string, 
            name: string, 
            type?: string,
            children: TChildren, 
            faIcon?: string
        }) {
            super({ 
                id, 
                name, 
                type: type || "FolderNode", 
                children, 
                faIcon: faIcon ? faIcon : "fas fa-folder" })
        }
    }


    class RootNode extends FolderNode {

        public readonly favorites: Array<Favorite>

        constructor({favorites, children}: {
            favorites, 
            children?: TChildren}) {

            super({ 
                id: 'explorer', 
                name: 'Explorer', 
                type:"RootNode", 
                children: children ? children : getRootChildren$() 
            })
            this.favorites = favorites
        }
    }


    class GroupNode extends FolderNode {

        public readonly groupId: string
        public readonly  path: string
        constructor({groupId, path, children}:{
            groupId: string, 
            path, 
            children?
        }) {

            super({ 
                id: groupId, name: path.split('/').slice(-1)[0], 
                type:"GroupNode",
                children:  children ? children: getGroupChildren$(path),
                faIcon: "fas fa-users"
            })
            this.groupId= groupId
            this.path=path
        }
    };

    class DriveNode extends FolderNode {

        public readonly name: string
        public readonly driveId: string
        public readonly groupId: string

        constructor({ driveId, name, children }: {
            driveId, 
            name, 
            children?
        }) {
            super({ 
                id: driveId, 
                name,             
                type:"DriveNode",
                children: children? children : getFolderChildren$(driveId),
                faIcon: "fas fa-hdd" })
            this.driveId = driveId    }
    }


    class AssetFolderNode extends FolderNode {
        public readonly name: string
        public readonly folderId: string

        constructor({ folderId, name, children }:{ 
            folderId, 
            name, 
            children? 
        }) {
            super({ 
                id: folderId, 
                name,  
                type:"AssetFolderNode", 
                children: children ? children : getFolderChildren$(folderId) })
            this.folderId = folderId
        }
    }


    class ItemNode extends ExplorerTreeNode {

        constructor({ id, name , type, children, faIcon} : {
            id:string, 
            name: string, 
            type?: string,
            children?:TChildren, 
            faIcon
        }) {
            super({ 
                id, 
                name, 
                type: type || "ItemNode", 
                children, 
                faIcon })
        }
    }


    class AssetItemNode extends ItemNode {
        public readonly assetId: string

        constructor({ assetId, name, rawId, children }:{
            assetId, 
            name, 
            rawId, 
            children?
        }) {
            super({ 
                id: assetId,
                name, 
                type:"AssetItemNode",
                children: children ? children : getModules$( rawId), faIcon: "fas fa-box" })
            this.assetId = assetId
        }
    }


    export class ModuleItemNode extends ItemNode {
        
        public readonly factory : any
        public readonly library: {name: string, namespace: string, version: string}

        constructor({ factory, library }) {
            super({ 
                id: factory.uid, 
                name: factory.displayName, 
                type:"ModuleItemNode",
                faIcon:"" 
            })
            this.factory = factory
            this.library = library
        }
    }


    class FavoriteNode extends ItemNode {

        public readonly favorite : Favorite

        static getChildrenFactory = {
            'AssetFolderNode' : (favorite) => getFolderChildren$(favorite.id),
        }
        public readonly assetId: string

        constructor({favorite} : {
            favorite:Favorite
        }) {
            super({ 
                id: "favorite_"+favorite.id,
                name: favorite.name, 
                type:"FavoriteNode",
                children: FavoriteNode.getChildrenFactory[favorite.type](favorite), 
                faIcon: "fas fa-folder" 
            })
            this.favorite = favorite
        }
    }


    class Favorite{

        constructor(
            public readonly id: string, 
            public readonly name: string, 
            public readonly type: string){}
    }

    function getStoredFavorites(){

        let favoritesStr = localStorage.getItem('flux-builder#favorites') 
        let favorites = favoritesStr ? JSON.parse(favoritesStr) : []
        return favorites as Array<Favorite>
    }


    function getRootChildren$() {
        let favorites = getStoredFavorites()
        return getGroupChildren$().pipe(
            map( children => [...children,...favorites.map( favorite => new FavoriteNode({favorite}))])
        )
    }


    function getGroupChildren$(path=""): Observable<Array<GroupNode | DriveNode>> {
        return AssetsBrowserClient.getGroupChildren$(path).pipe(
            map( (groupResp: GroupsResp) => {
                return [
                    ...groupResp.groups.map( group => {
                        return new GroupNode( {groupId: group.id, path: group.path})
                    }),
                    ...groupResp.drives.map( drive => {
                        return new DriveNode( {driveId: drive.driveId, name: drive.name})
                    })
                ]
            })
        ) as any
    }

    function getFolderChildren$(folderId: string): Observable<Array<AssetFolderNode | AssetItemNode>> {
        return AssetsBrowserClient.getFolderChildren$(folderId).pipe(
            map( (resp: ChildrenResp) => {
                return [
                    ...resp.folders.map( folder => {
                        return new AssetFolderNode( {folderId: folder.folderId, name: folder.name})
                    }),
                    ...resp.items
                    .filter( item => item["kind"]=='package')
                    .map( item => {
                        return new AssetItemNode( { assetId: item.assetId, name: item.name, rawId: item.rawId})
                    })
                ]
            })
        )
    }

    function getModules$(assetId: string): Observable<Array<any>> {
        
        return AssetsBrowserClient.getModules$(assetId).pipe(
            map( ( {factories, library, loadingGraph}:{factories: Array<Factory>, library: any, loadingGraph: any})=> {
                
                return factories.map( v => new ModuleItemNode({
                    factory:v, 
                    library: {name:library.name, version: library.versions[0], namespace:library.namespace}
                    
                    })
                )
            })
        )
    }

}