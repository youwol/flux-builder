/** @format
 *
 *                  $$\
 *                  \__|
 *    $$\  $$\  $$\ $$\  $$$$$$\
 *    $$ | $$ | $$ |$$ |$$  __$$\
 *    $$ | $$ | $$ |$$ |$$ /  $$ |
 *    $$ | $$ | $$ |$$ |$$ |  $$ |
 *    \$$$$$\$$$$  |$$ |$$$$$$$  |
 *     \_____\____/ \__|$$  ____/
 *                      $$ |
 *                      $$ |
 *                      \__|
 *
 *    THIS IS A WORK IN PROGRESS
 *
 */

import {
  AppObservables,
  AppStore,
} from '../../app/builder-editor/builder-state'

import { ProjectTreeView } from '../../app/views/project-tree.view'
import { anything, instance, mock, when } from 'ts-mockito'
import {
  Component,
  GroupModules,
  ModuleConfiguration,
  ModuleFlux,
  PluginFlux,
  Project,
  Workflow,
  WorkflowDelta,
} from '@youwol/flux-core'
import { ReplaySubject, Subject } from 'rxjs'
import ComponentNode = ProjectTreeView.ComponentNode
import ModuleNode = ProjectTreeView.ModuleNode
import GroupNode = ProjectTreeView.GroupNode
import PluginNode = ProjectTreeView.PluginNode

function noop(_: ModuleFlux) {
  // Do nothing but do it well
}

export function getMockedNodeIdBuilder(
  nodesIdsForModules: { mdle: ModuleFlux; nodeId: string }[] = [],
  nodesIdsForModulesIds: { moduleId: string; nodeId: string }[] = [],
) {
  const nodeIdBuilderMocker = mock<ProjectTreeView.NodeIdBuilder>()

  when(nodeIdBuilderMocker.buildForRootComponent()).thenReturn(
    Component.rootComponentId,
  )

  nodesIdsForModules.forEach((entry) =>
    when(nodeIdBuilderMocker.buildForModule(entry.mdle)).thenReturn(
      entry.nodeId,
    ),
  )
  nodesIdsForModulesIds.forEach((entry) =>
    when(nodeIdBuilderMocker.buildForModuleId(entry.moduleId)).thenReturn(
      entry.nodeId,
    ),
  )
  return instance(nodeIdBuilderMocker)
}

interface DefaultsFlux {
  moduleFlux: {
    fixture: FixtureModuleFlux
  }
  groupFlux: {
    fixture: FixtureGroupModule
  }
  componentFlux: {
    fixture: FixtureComponentModule
  }
  rootFlux: {
    fixture: FixtureRootModule
  }
  pluginFlux: {
    fixture: Partial<FixturePlugin>
  }
  project: {
    fixture: FixtureProject
  }
  workflow: {
    fixture: FixtureWorkflow
  }
}

export const defaultsFlux: DefaultsFlux = {
  moduleFlux: {
    fixture: {
      moduleId: '_DEFAULT_MODULE_MODULE_ID',
      moduleConfiguration: {
        title: '_DEFAULT_MODULE_CONFIGURATION_TITLE',
      },
    },
  },
  groupFlux: {
    fixture: {
      moduleId: '_DEFAULT_GROUP_MODULE_ID',
      moduleConfiguration: {
        title: '_DEFAULT_GROUP_CONFIGURATION_TITLE',
      },
      children: [],
    },
  },
  componentFlux: {
    fixture: {
      moduleId: '_DEFAULT_COMPONENT_MODULE_ID',
      moduleConfiguration: {
        title: '_DEFAULT_COMPONENT_CONFIGURATION_TITLE',
      },
      children: [],
    },
  },
  rootFlux: {
    fixture: {
      moduleId: Component.rootComponentId,
      moduleConfiguration: {
        title: '_DEFAULT_ROOT_CONFIGURATION_TITLE',
      },
      children: [],
    },
  },
  pluginFlux: {
    fixture: {
      moduleId: '_DEFAULT_PLUGIN_MODULE_ID',
      moduleConfiguration: {
        title: '_DEFAULT_PLUGIN_CONFIGURATION_TITLE',
      },
    },
  },
  project: {
    fixture: {
      projectName: '_DEFAULT_PROJECT_NAME',
      workflow: {
        modules: [],
        plugins: [],
      },
    },
  },
  workflow: {
    fixture: {
      modules: [],
      plugins: [],
    },
  },
}

type Fn<T> = () => T

type Either<T> = T | Fn<T>

function convert<T>(v: Either<T>): () => T {
  if (typeof v == 'function') {
    return v as Fn<T>
  } else {
    return () => v
  }
}

interface FixtureModuleConfiguration {
  title?: Either<string>
}

export function getMockedModuleConfiguration(
  fixture?: FixtureModuleConfiguration | ModuleConfiguration,
): ModuleConfiguration {
  if (fixture instanceof ModuleConfiguration) {
    return fixture
  }
  const finalFixture: FixtureModuleConfiguration = {
    ...defaultsFlux.moduleFlux.fixture.moduleConfiguration,
    ...fixture,
  }
  const moduleConfigurationMocker = mock(ModuleConfiguration)

  when(moduleConfigurationMocker.title).thenCall(convert(finalFixture.title))
  const mockModuleConfiguration = instance(moduleConfigurationMocker)
  Object.setPrototypeOf(
    moduleConfigurationMocker,
    ModuleConfiguration.prototype,
  )
  return mockModuleConfiguration
}

interface FixtureModuleFlux {
  moduleId?: Either<string>
  moduleConfiguration?: FixtureModuleConfiguration | ModuleConfiguration
}

export function getMockedModule(
  fixture?: FixtureModuleFlux | ModuleFlux,
): ModuleFlux {
  if (fixture instanceof ModuleFlux) {
    return fixture
  }
  const finalFixture: FixtureModuleFlux = {
    ...defaultsFlux.moduleFlux.fixture,
    ...fixture,
  }
  const moduleFluxMocker = mock(ModuleFlux)
  when(moduleFluxMocker.moduleId).thenCall(convert(finalFixture.moduleId))
  when(moduleFluxMocker.configuration).thenReturn(
    getMockedModuleConfiguration(finalFixture.moduleConfiguration),
  )
  const mockModuleFlux = instance(moduleFluxMocker)
  Object.setPrototypeOf(mockModuleFlux, ModuleFlux.prototype)
  return mockModuleFlux
}

interface FixtureGroupModule extends FixtureModuleFlux {
  children?: ModuleFlux[]
}

export function getMockedGroup(fixture?: FixtureGroupModule) {
  const finalFixture: FixtureGroupModule = {
    ...defaultsFlux.groupFlux.fixture,
    ...fixture,
  }
  const groupMocker = mock(GroupModules.Module)
  when(groupMocker.moduleId).thenCall(convert(finalFixture.moduleId))
  when(groupMocker.configuration).thenReturn(
    getMockedModuleConfiguration(finalFixture.moduleConfiguration),
  )
  when(groupMocker.getDirectChildren(anything())).thenReturn(
    finalFixture.children,
  )
  const mockGroup = instance(groupMocker)
  Object.setPrototypeOf(mockGroup, GroupModules.Module.prototype)
  return mockGroup
}

interface FixtureComponentModule extends FixtureModuleFlux {
  children?: ModuleFlux[]
}

export function getMockedComponent(fixture?: FixtureComponentModule) {
  const finalFixture: FixtureComponentModule = {
    ...defaultsFlux.componentFlux.fixture,
    ...fixture,
  }
  const componentMocker = mock(Component.Module)
  when(componentMocker.moduleId).thenCall(convert(finalFixture.moduleId))
  when(componentMocker.configuration).thenReturn(
    getMockedModuleConfiguration(finalFixture.moduleConfiguration),
  )
  when(componentMocker.getDirectChildren(anything())).thenReturn(
    finalFixture.children,
  )
  const mockComponent = instance(componentMocker)
  Object.setPrototypeOf(mockComponent, Component.Module.prototype)
  return mockComponent
}

interface FixturePlugin extends FixtureModuleFlux {
  parent?: ModuleFlux
}

export function getMockedPlugin(fixture: FixturePlugin) {
  const finalFixture: FixturePlugin = {
    ...defaultsFlux.pluginFlux.fixture,
    ...fixture,
  }

  const pluginFluxMocker = mock(PluginFlux)
  when(pluginFluxMocker.moduleId).thenCall(convert(finalFixture.moduleId))
  when(pluginFluxMocker.configuration).thenReturn(
    getMockedModuleConfiguration(finalFixture.moduleConfiguration),
  )
  when(pluginFluxMocker.parentModule).thenReturn(finalFixture.parent)
  const mockPlugin = instance(pluginFluxMocker)
  Object.setPrototypeOf(mockPlugin, PluginFlux.prototype)
  return mockPlugin
}

type FixtureRootModule = FixtureGroupModule

export function getMockedRootModule(
  fixture?: FixtureRootModule,
): Component.Module {
  const finalFixture: FixtureRootModule = {
    ...defaultsFlux.rootFlux.fixture,
    ...fixture,
  }
  return getMockedComponent(finalFixture)
}

defaultsFlux.workflow.fixture.modules.push(getMockedRootModule())

interface FixtureWorkflow {
  modules?: ModuleFlux[]
  plugins?: PluginFlux<ModuleFlux>[]
}

export function getMockedWorkflow(
  fixture?: FixtureWorkflow | Workflow,
): Workflow {
  if (fixture instanceof Workflow) {
    return fixture
  }
  const finalFixture: FixtureWorkflow = {
    ...defaultsFlux.workflow.fixture,
    ...fixture,
  }

  const workflowMocker = mock(Workflow)

  when(workflowMocker.modules).thenReturn(finalFixture.modules)
  when(workflowMocker.plugins).thenReturn(finalFixture.plugins)
  const mockWorkflow = instance(workflowMocker)
  Object.setPrototypeOf(mockWorkflow, workflowMocker)
  return mockWorkflow
}

defaultsFlux.project.fixture.workflow = getMockedWorkflow()

interface FixtureProject {
  projectName?: Either<string>
  workflow?: FixtureWorkflow | Workflow
}

export function getMockedProject(fixture?: FixtureProject | Project): Project {
  if (fixture instanceof Project) {
    return fixture
  }
  const finalFixture: FixtureProject = {
    ...defaultsFlux.project.fixture,
    ...fixture,
  }
  const projectMocker = mock(Project)
  when(projectMocker.workflow).thenReturn(
    getMockedWorkflow(finalFixture.workflow),
  )
  when(projectMocker.name).thenCall(convert(finalFixture.projectName))
  const mockProject = instance(projectMocker)
  Object.setPrototypeOf(mockProject, projectMocker)
  return mockProject
}

interface DefaultAppStore {
  appStore: FixtureAppStore
  appObservables: FixtureAppObservables
}

const defaultAppStore: DefaultAppStore = {
  appStore: {
    project: defaultsFlux.project.fixture,
  },
  appObservables: {
    projectUpdated: new ReplaySubject<WorkflowDelta>(1),
    moduleSelected: new Subject<ModuleFlux>(),
  },
}

interface FixtureAppObservables {
  projectUpdated?: ReplaySubject<WorkflowDelta>
  moduleSelected?: Subject<ModuleFlux>
}

export function getMockedAppObservables(
  fixture?: FixtureAppObservables | AppObservables,
): AppObservables {
  if (fixture instanceof AppObservables) {
    return fixture
  }
  const finalFixture: FixtureAppObservables = {
    ...defaultAppStore.appObservables,
    ...fixture,
  }
  const appObservablesMocker = mock(AppObservables)

  when(appObservablesMocker.projectUpdated$).thenReturn(
    finalFixture.projectUpdated,
  )

  when(appObservablesMocker.moduleSelected$).thenReturn(
    finalFixture.moduleSelected,
  )

  const mockAppObservables = instance(appObservablesMocker)
  Object.setPrototypeOf(mockAppObservables, AppObservables.prototype)
  return mockAppObservables
}

defaultAppStore.appStore.appObservables = getMockedAppObservables()

interface FixtureAppStore {
  project?: FixtureProject | Project
  appObservables?: FixtureAppObservables | AppObservables
}

// CustomizeMocker should be generalized and better exposed to caller
export function getMockedAppStore(
  fixture?: FixtureAppStore | AppStore,
  customizeMocker: (mocker) => void = noop,
): AppStore {
  if (fixture instanceof AppStore) {
    return fixture
  }
  const finalFixture: FixtureAppStore = {
    ...defaultAppStore.appStore,
    ...fixture,
  }
  const appStoreMocker = mock(AppStore)
  when(appStoreMocker.project).thenReturn(
    getMockedProject(finalFixture.project),
  )
  when(appStoreMocker.appObservables).thenReturn(
    getMockedAppObservables(finalFixture.appObservables),
  )
  customizeMocker(appStoreMocker)
  const mockAppStore = instance(appStoreMocker)
  Object.setPrototypeOf(mockAppStore, AppStore.prototype)
  return mockAppStore
}

interface FixtureState {
  appStore?: FixtureAppStore | AppStore
}

const defaultFixtureState = {
  appStore: defaultAppStore.appStore,
}

// CustomizeMocker should be generalized and better exposed to caller
export function getMockedState(
  fixture?: FixtureState,
  customizeMocker: (mocker) => void = noop,
) {
  const finalFixture: FixtureState = { ...defaultFixtureState, ...fixture }
  const stateMocker = mock(ProjectTreeView.State)
  when(stateMocker.appStore).thenReturn(
    getMockedAppStore(finalFixture.appStore),
  )
  customizeMocker(stateMocker)
  const mockState = instance(stateMocker)
  Object.setPrototypeOf(mockState, PluginFlux.prototype)
  return mockState
}

export function getMockedRootNode() {
  const rootNodeMocker = mock(ComponentNode)
  when(rootNodeMocker.id).thenReturn(Component.rootComponentId)
  const mockRootNode = instance(rootNodeMocker)
  Object.setPrototypeOf(mockRootNode, ComponentNode.prototype)
  return mockRootNode
}

interface FixtureModuleNode {
  id?: string
  moduleId?: string
  moduleTitle?: string
}

const defaultFixtureModuleNodeId = '_DEFAULT_NODE_ID'
const defaultFixtureModuleNodeModuleId = '_DEFAULT_NODE_MODULE_ID'
const defaultFixtureModuleNodeModuleTitle = '_DEFAULT_NODE_MODULE_TITLE'
const defaultFixtureModuleNode = {
  id: defaultFixtureModuleNodeId,
  moduleId: defaultFixtureModuleNodeModuleId,
  moduleTitle: defaultFixtureModuleNodeModuleTitle,
}

export function getMockedModuleNode(fixture?: FixtureModuleNode) {
  const finalFixture: FixtureModuleNode = {
    ...defaultFixtureModuleNode,
    ...fixture,
  }
  const nodeMocker = mock(ModuleNode)
  when(nodeMocker.id).thenReturn(finalFixture.id)
  when(nodeMocker.getModuleId()).thenReturn(finalFixture.moduleId)
  when(nodeMocker.getModuleTitle()).thenReturn(finalFixture.moduleTitle)
  const mockModuleNode = instance(nodeMocker)
  Object.setPrototypeOf(mockModuleNode, ModuleNode.prototype)
  return mockModuleNode
}

type FixtureGroupNode = FixtureModuleNode

const defaultFixtureGroupNodeId = '_DEFAULT_GROUP_ID'
const defaultFixtureGroupNodeModuleId = '_DEFAULT_GROUP_MODULE_ID'
const defaultFixtureGroupNodeModuleTitle = '_DEFAULT_GROUP_MODULE_TITLE'
const defaultFixtureGroupNode = {
  id: defaultFixtureGroupNodeId,
  moduleId: defaultFixtureGroupNodeModuleId,
  moduleTitle: defaultFixtureGroupNodeModuleTitle,
}

export function getMockedGroupNode(fixture?: FixtureGroupNode) {
  const finalFixture: FixtureGroupNode = {
    ...defaultFixtureGroupNode,
    ...fixture,
  }
  const nodeMocker = mock(GroupNode)
  when(nodeMocker.id).thenReturn(finalFixture.id)
  when(nodeMocker.getModuleId()).thenReturn(finalFixture.moduleId)
  when(nodeMocker.getModuleTitle()).thenReturn(finalFixture.moduleTitle)
  const mockGroupNode = instance(nodeMocker)
  Object.setPrototypeOf(mockGroupNode, GroupNode.prototype)
  return mockGroupNode
}

type FixtureComponentNode = FixtureGroupNode

const defaultFixtureComponentNodeId = '_DEFAULT_GROUP_ID'
const defaultFixtureComponentNodeModuleId = '_DEFAULT_GROUP_MODULE_ID'
const defaultFixtureComponentNodeModuleTitle = '_DEFAULT_GROUP_MODULE_TITLE'
const defaultFixtureComponentNode: FixtureComponentNode = {
  id: defaultFixtureComponentNodeId,
  moduleId: defaultFixtureComponentNodeModuleId,
  moduleTitle: defaultFixtureComponentNodeModuleTitle,
}

export function getMockedComponentNode(fixture?: FixtureComponentNode) {
  const finalFixture: FixtureComponentNode = {
    ...defaultFixtureComponentNode,
    ...fixture,
  }
  const nodeMocker = mock(ComponentNode)
  when(nodeMocker.id).thenReturn(finalFixture.id)
  when(nodeMocker.getModuleId()).thenReturn(finalFixture.moduleId)
  when(nodeMocker.getModuleTitle()).thenReturn(finalFixture.moduleTitle)
  const mockComponentNode = instance(nodeMocker)
  Object.setPrototypeOf(mockComponentNode, ComponentNode.prototype)
  return mockComponentNode
}

type FixturePluginNode = FixtureModuleNode

const defaultFixturePluginNodeId = '_DEFAULT_NODE_ID'
const defaultFixturePluginNode: FixturePluginNode = {
  id: defaultFixturePluginNodeId,
}

export function getMockedPluginNode(fixture?: FixturePluginNode) {
  const finalFixture: FixturePluginNode = {
    ...defaultFixturePluginNode,
    ...fixture,
  }
  const nodeMocker = mock(PluginNode)
  when(nodeMocker.id).thenReturn(finalFixture.id)
  when(nodeMocker.getModuleId()).thenReturn(finalFixture.moduleId)
  when(nodeMocker.getModuleTitle()).thenReturn(finalFixture.moduleTitle)
  const mockPluginNode = instance(nodeMocker)
  Object.setPrototypeOf(mockPluginNode, PluginNode.prototype)
  return mockPluginNode
}
