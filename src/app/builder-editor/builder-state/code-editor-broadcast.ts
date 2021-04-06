import { map, filter, take, tap, mergeMap } from 'rxjs/operators'
import { BehaviorSubject, interval } from 'rxjs'


export namespace CodeEditor{

    let senderFluxChannel   =  new BroadcastChannel("out=>code-editor@BroadcastDrive")
    let recieverFluxChannel =  new BroadcastChannel("code-editor@BroadcastDrive=>out")

    export function mountBroadcastDrive( codeEditor, urlCodeEditor ) {

        let ownerId = codeEditor.ownerId
        let pingMessage = {
            action:"ping", 
            channelResp :"code-editor=>flux", 
            ownerId: ownerId
        }
        let isConnected = false
        let communicationEstablished$ = new BehaviorSubject<boolean>(false)
        let interval$ = interval(500).pipe( take(1))
        let mountedDrive = undefined

        interval$.pipe( take(1) )
        .subscribe( () => {
            if(!isConnected){
               window.open(urlCodeEditor, '_tab_code_editor')
               interval(200).pipe(filter( () => !isConnected)).subscribe( () => senderFluxChannel.postMessage(pingMessage))
            }
        })

        senderFluxChannel.postMessage(pingMessage)

        communicationEstablished$.pipe(
            filter( d => d == true ),
            mergeMap( () =>  codeEditor.mount$.pipe( map( d => codeEditor.drive(d) ), tap( d => mountedDrive = d)))
        ).subscribe( (drive:any) => {
            let action =  { 
                action:"mount",  
                ownerId: ownerId,
                codeEditor: { drive: { name: drive.name, data: drive.data}, UI: codeEditor.UI }}
            senderFluxChannel.postMessage(action)
        })

        let subs = codeEditor.unmount$.subscribe( () =>{
            senderFluxChannel.postMessage({  action:"unmount",  ownerId: ownerId })
            subs.unsubscribe()
        })

        recieverFluxChannel.onmessage = ({data}) => {

            if( data.action == "ping-ack" && data.ownerId == ownerId ){
                isConnected = true
                communicationEstablished$.next(true)
            }
            if( data.action =="updateFile" && data.ownerId == ownerId  ){
                let ack = () => senderFluxChannel.postMessage({ action:"updateFile-ack", actionId: data.actionId, ownerId: ownerId })
                mountedDrive.onFileUpdated( data.data, ack)
            }
        }
    }
}