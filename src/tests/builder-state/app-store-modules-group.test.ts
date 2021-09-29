
import { filter, skip } from 'rxjs/operators'
import { GroupModules } from '@youwol/flux-core'
import  './dependencies'
import { AppDebugEnvironment, AppStore, AppObservables } from '../../app/builder-editor/builder-state'
import { environment } from '../common/dependencies'


test('test from project loading', (done) => {

    
  AppDebugEnvironment.getInstance().debugOn = false

  let appStore : AppStore = AppStore.getInstance(environment)

  let appObservables = AppObservables.getInstance()

  appObservables.ready$.pipe(
      filter(d=>d)
  ).subscribe((_)=>{
      expect(appStore.getActiveLayer().moduleId).toEqual("root layer")
      let mdleGroup = appStore.getModule("GroupModules_child-layer") as GroupModules.Module
      mdleGroup.Factory.BuilderView.notifier$.next({type:'layerFocused', data: mdleGroup.moduleId}) 
  })
  appObservables.activeLayerUpdated$.pipe(skip(1)).subscribe( d =>{
      let layerId = appStore.getActiveLayer().moduleId
      expect(layerId).toEqual("child-layer") 
      done()
    })

  appStore.loadProjectId("simpleProjectConnection")
})

