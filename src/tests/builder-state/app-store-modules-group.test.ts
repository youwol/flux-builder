
import { filter, skip } from 'rxjs/operators'
import { GroupModules } from '@youwol/flux-core'
import  './dependencies'
import { AppDebugEnvironment, AppStore, AppObservables } from '../../app/builder-editor/builder-state'
import { environment } from '../common/dependencies'


test('test from project loading', (done) => {

  AppDebugEnvironment.getInstance().debugOn = false

  const appStore : AppStore = AppStore.getInstance(environment)

  const appObservables = AppObservables.getInstance()

  appObservables.ready$.pipe(
      filter(d=>d)
  ).subscribe((_)=>{
      expect(appStore.getActiveGroup().moduleId).toEqual("Component_root-component")
      const mdleGroup = appStore.getModule("GroupModules_child-layer") as GroupModules.Module
      mdleGroup.Factory.BuilderView.notifier$.next({type:'groupFocused', data: mdleGroup.moduleId}) 
  })
  appObservables.activeLayerUpdated$.pipe(skip(1)).subscribe( d =>{
      const layerId = appStore.getActiveGroup().moduleId
      expect(layerId).toEqual("GroupModules_child-layer") 
      done()
    })

  appStore.loadProjectId("simpleProjectConnection")
})

