/** @format */

import '../common/dependencies'
import {
  Component,
  GroupModules,
  ModuleFlux,
  PluginFlux,
  WorkflowDelta,
} from '@youwol/flux-core'
import {
  getMockedAppStore,
  getMockedComponent,
  getMockedComponentNode,
  getMockedGroup,
  getMockedGroupNode,
  getMockedModule,
  getMockedModuleNode,
  getMockedNodeIdBuilder,
  getMockedPlugin,
  getMockedPluginNode,
  getMockedRootModule,
  getMockedRootNode,
  getMockedState,
  getMockedWorkflow,
} from '../common/mockito'
import { anything, instance, mock, resetCalls, verify, when } from 'ts-mockito'
import { ReplaySubject } from 'rxjs'
import { HTMLElement$, render } from '@youwol/flux-view'
import { ProjectTreeView } from '../../app/views/project-tree.view'
import ModuleNode = ProjectTreeView.ModuleNode
import PluginNode = ProjectTreeView.PluginNode
import GroupNode = ProjectTreeView.GroupNode
import ComponentNode = ProjectTreeView.ComponentNode
import nodeHeaderView = ProjectTreeView.nodeHeaderView
import nodeIdBuilderForUniq = ProjectTreeView.nodeIdBuilderForUniq

describe('ProjectTreeView.nodeIdBuilder', () => {
  it('should return node id for moduleId containing both moduleId and unique string', () => {
    // Given
    const uniq: string = 'UNIQ_' + Date.now()
    const moduleId = 'ModuleId'

    const subject = ProjectTreeView.nodeIdBuilderForUniq(uniq)

    // When
    const actualNodeId = subject.buildForModuleId(moduleId)

    // Expect
    expect(ProjectTreeView.nodeIdBuilderForUniq(uniq)).toBeDefined()
    expect(actualNodeId).not.toBe(moduleId)
    expect(actualNodeId).toContain(uniq)
    expect(actualNodeId).toContain(moduleId)
  })

  it('should return node id for module containing both moduleId and unique string', () => {
    // Given
    const uniq: string = 'UNIQ_' + Date.now()
    const moduleId = 'ModuleId'

    const subject = nodeIdBuilderForUniq(uniq)

    // When
    const actualNodeId = subject.buildForModule(
      getMockedModule({ moduleId: moduleId }),
    )

    // Expect
    expect(actualNodeId).not.toBe(moduleId)
    expect(actualNodeId).toContain(uniq)
    expect(actualNodeId).toContain(moduleId)
  })

  it(
    'should return node id for root component containing both ' +
      '« Component.rootComponentId » and unique string',
    () => {
      // Given
      const uniq: string = 'UNIQ_' + Date.now()

      const subject = ProjectTreeView.nodeIdBuilderForUniq(uniq)

      // When
      const actualNodeId = subject.buildForRootComponent()

      // Expect
      expect(actualNodeId).toBeDefined()
      expect(actualNodeId).not.toBe(Component.rootComponentId)
      expect(actualNodeId).toContain(uniq)
      expect(actualNodeId).toContain(Component.rootComponentId)
    },
  )

  it('should not be instantiable if unique string is undefined, null or empty', () => {
    const subject = ProjectTreeView.nodeIdBuilderForUniq

    // Given
    let uniqUndefined
    const uniqNull = null
    const uniqEmpty = ''
    const expectedError = new Error(
      'Unique string must be defined and not empty',
    )

    // Expect
    expect(() => subject(uniqUndefined)).toThrow(expectedError)
    expect(() => subject(uniqNull)).toThrow(expectedError)
    expect(() => subject(uniqEmpty)).toThrow(expectedError)
  })
})

describe('ProjectTreeView.rootFactory', () => {
  const subject = ProjectTreeView.rootFactory

  it('should failed if project has no root module', () => {
    // Given
    const nodeId = 'NODE_ID_202110131648'
    const mockModule = getMockedRootModule({
      moduleId: 'NOT_ROOT_COMPONENT_ID',
    })
    const nodeIdBuilder = getMockedNodeIdBuilder([
      { mdle: mockModule, nodeId: nodeId },
    ])
    const mockWorkflow = getMockedWorkflow({ modules: [mockModule] })
    const expectedError = new Error('No root component for this project')

    // Expect
    expect(() => subject(mockWorkflow, nodeIdBuilder)).toThrow(expectedError)
  })

  it('should return tree of nodes with only root node for empty project', () => {
    // Given
    const expectedNodeModuleTitle = 'TITLE'
    const expectedNodeModuleId = Component.rootComponentId
    const expectedNodeId = 'NODE_ID'
    const expectedNodeChildren = []

    const mockModule = getMockedComponent({
      moduleId: expectedNodeModuleId,
      moduleConfiguration: { title: expectedNodeModuleTitle },
    })
    const mockNodeIdBuilder = getMockedNodeIdBuilder([
      { mdle: mockModule, nodeId: expectedNodeId },
    ])
    const mockWorkflow = getMockedWorkflow({ modules: [mockModule] })

    // When
    const actualRootNode = subject(mockWorkflow, mockNodeIdBuilder)
    const actualRootNodeID = actualRootNode.id
    const actualRootNodeModuleId = actualRootNode.getModuleId()
    const actualRootNodeModuleTitle = actualRootNode.getModuleTitle()
    const actualRootNodeChildren = actualRootNode.resolvedChildren()

    // Expect
    expect(actualRootNode).toBeDefined()
    expect(actualRootNodeID).toContain(expectedNodeId)
    expect(actualRootNodeModuleId).toBe(expectedNodeModuleId)
    expect(actualRootNodeModuleTitle).toBe(expectedNodeModuleTitle)
    expect(actualRootNodeChildren).toStrictEqual(expectedNodeChildren)
  })

  it('should failed for module of unknown class', () => {
    // Given
    const mockUnknownModule = instance(mock(ModuleFlux))
    Object.setPrototypeOf(mockUnknownModule, Array.prototype)
    const expectedError = new Error(
      'Unknown module class for project tree view node creation',
    )

    const mockRootModule = getMockedRootModule({
      children: [mockUnknownModule],
    })
    const mockWorkflow = getMockedWorkflow({
      modules: [mockUnknownModule, mockRootModule],
    })
    const mockNodeIdBuilder = getMockedNodeIdBuilder()

    // Expect
    expect(() => subject(mockWorkflow, mockNodeIdBuilder)).toThrow(
      expectedError,
    )
  })

  it('should return a tree of nodes for a simple workflow', () => {
    // Given ModuleFlux
    const expectedNodeId = 'NODE_ID'
    const expectedNodeTitle = 'MODULE_TITLE'
    const expectedNodeModuleId = 'NODE_MODULE_ID'
    const mockModule: ModuleFlux = getMockedModule({
      moduleId: expectedNodeModuleId,
      moduleConfiguration: { title: expectedNodeTitle },
    })

    // Given ModuleFlux
    const expectedNodeWithChildId = 'NODE_WITH_CHILD_ID'
    const expectedNodeWithChildTitle = 'MODULE_WITH_PLUGIN_TITLE'
    const expectedNodeWithChildModuleId = 'NODE_WITH_CHILD_MODULE_ID'
    const expectedNodeWithChildChildrenLength = 1
    const mockModuleWithPlugin: ModuleFlux = getMockedModule({
      moduleId: expectedNodeWithChildModuleId,
      moduleConfiguration: { title: expectedNodeWithChildTitle },
    })

    // Given GroupModules.Module, containing Module
    const expectedGroupId = 'GROUP_ID'
    const expectedGroupTitle = 'GROUP_TITLE'
    const expectedGroupModuleId = 'GROUP_MODULE_ID'
    const expectedGroupChildrenLength = 2
    const mockGroup: GroupModules.Module = getMockedGroup({
      moduleId: expectedGroupModuleId,
      moduleConfiguration: { title: expectedGroupTitle },
      children: [mockModule, mockModuleWithPlugin],
    })

    // Given PluginFlux, attached to ModuleFlux
    const expectedPluginId = 'NODE_PLUGIN_ID'
    const expectedPluginTitle = 'PLUGIN_TITLE'
    const expectedPluginModuleId = 'PLUGIN_MODULE_ID'
    const mockPlugin: PluginFlux<ModuleFlux> = getMockedPlugin({
      moduleId: expectedPluginModuleId,
      moduleConfiguration: { title: expectedPluginTitle },
      parent: mockModuleWithPlugin,
    })

    // Given Root, containing GroupModules.Module and PluginFlux
    const expectedRootId = 'ROOT_ID'
    const expectedRootTitle = 'ROOT_TITLE'
    const expectedRootModuleId = Component.rootComponentId
    const expectedRootChildrenLength = 1
    const mockRootModule: Component.Module = getMockedComponent({
      moduleId: Component.rootComponentId,
      moduleConfiguration: { title: expectedRootTitle },
      children: [mockGroup, mockPlugin],
    })

    const mockWorkflow = getMockedWorkflow({
      modules: [mockRootModule, mockModule, mockGroup, mockPlugin],
      plugins: [mockPlugin],
    })

    const nodeIdBuilder = getMockedNodeIdBuilder([
      { mdle: mockRootModule, nodeId: expectedRootId },
      { mdle: mockGroup, nodeId: expectedGroupId },
      { mdle: mockModule, nodeId: expectedNodeId },
      { mdle: mockPlugin, nodeId: expectedPluginId },
      { mdle: mockModuleWithPlugin, nodeId: expectedNodeWithChildId },
    ])

    // Then
    const actualRootNode = subject(mockWorkflow, nodeIdBuilder)

    // Expect root
    expect(actualRootNode).toBeDefined()
    expect(actualRootNode).toBeInstanceOf(ComponentNode)
    expect(actualRootNode.id).toContain(expectedRootId)
    expect(actualRootNode.getModuleId()).toBe(expectedRootModuleId)
    expect(actualRootNode.getModuleTitle()).toBe(expectedRootTitle)
    expect(actualRootNode.resolvedChildren()).toBeDefined()
    expect(actualRootNode.resolvedChildren()).toHaveLength(
      expectedRootChildrenLength,
    )

    // Expect GroupNode
    const actualGroup = actualRootNode.resolvedChildren()[0] as GroupNode
    expect(actualGroup).toBeDefined()
    expect(actualGroup).toBeInstanceOf(GroupNode)
    expect(actualGroup.id).toBe(expectedGroupId)
    expect(actualGroup.getModuleId()).toBe(expectedGroupModuleId)
    expect(actualGroup.getModuleTitle()).toBe(expectedGroupTitle)
    expect(actualGroup.resolvedChildren()).toBeDefined()
    expect(actualGroup.resolvedChildren()).toHaveLength(
      expectedGroupChildrenLength,
    )

    // Expect ModuleNode
    const actualChild = actualGroup.resolvedChildren()[0] as ModuleNode
    expect(actualChild).toBeDefined()
    expect(actualChild).toBeInstanceOf(ModuleNode)
    expect(actualChild.id).toBe(expectedNodeId)
    expect(actualChild.getModuleId()).toBe(expectedNodeModuleId)
    expect(actualChild.getModuleTitle()).toBe(expectedNodeTitle)
    expect(actualChild.resolveChildren()).toBeUndefined()

    // Expect ModuleNode, with child
    const actualChildWithPlugin =
      actualGroup.resolvedChildren()[1] as ModuleNode
    expect(actualChildWithPlugin).toBeDefined()
    expect(actualChildWithPlugin).toBeInstanceOf(ModuleNode)
    expect(actualChildWithPlugin.id).toBe(expectedNodeWithChildId)
    expect(actualChildWithPlugin.getModuleId()).toBe(
      expectedNodeWithChildModuleId,
    )
    expect(actualChildWithPlugin.getModuleTitle()).toBe(
      expectedNodeWithChildTitle,
    )
    expect(actualChildWithPlugin.resolvedChildren()).toBeDefined()
    expect(actualChildWithPlugin.resolvedChildren()).toHaveLength(
      expectedNodeWithChildChildrenLength,
    )

    // Expect PluginNode
    const actualPlugin =
      actualChildWithPlugin.resolvedChildren()[0] as PluginNode
    expect(actualPlugin).toBeDefined()
    expect(actualPlugin).toBeInstanceOf(ModuleNode)
    expect(actualPlugin.id).toBe(expectedPluginId)
    expect(actualPlugin.id).toBe(expectedPluginId)
    expect(actualPlugin.getModuleId()).toBe(expectedPluginModuleId)
    expect(actualPlugin.getModuleTitle()).toBe(expectedPluginTitle)
  })
})

describe('ProjectTreeView.nodeHeaderView', () => {
  const subject = nodeHeaderView

  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('should return icon fa-play and project name for root node', () => {
    // Given
    const expectedProjectName = 'PROJECT_NAME'
    const expectedClass = 'fa-play'
    const mockRootNode = getMockedRootNode()
    const mockState = getMockedState({
      appStore: { project: { projectName: expectedProjectName } },
    })

    // When
    document.body.appendChild(render(subject(mockState, mockRootNode)))
    const actualIcon = document.querySelector(`.${expectedClass}`)
    const actualDivText = document.querySelector('.project-tree-node')
      .children[1] as HTMLDivElement

    // Expect
    expect(actualIcon).toBeTruthy()
    expect(actualDivText.innerText).toBe(expectedProjectName)
  })

  it('should return module title for ModuleNode', () => {
    // Given
    const expectedModuleTitle = 'MODULE_TITLE'
    const mockModuleNode = getMockedModuleNode({
      moduleTitle: expectedModuleTitle,
    })
    const mockState = getMockedState()

    // When
    document.body.appendChild(render(subject(mockState, mockModuleNode)))
    const actualDivText = document.querySelector('.project-tree-node')
      .children[1] as HTMLDivElement

    // Expect
    expect(actualDivText.innerText).toBe(expectedModuleTitle)
  })

  it('should return icon fa-object-group and module title for GroupNode', () => {
    // Given
    const expectedGroupTitle = 'GROUP_TITLE'
    const expectedClass = 'fa-object-group'
    const mockGroupNode = getMockedGroupNode({
      moduleTitle: expectedGroupTitle,
    })
    const mockState = getMockedState()

    // When
    document.body.appendChild(render(subject(mockState, mockGroupNode)))
    const actualIcon = document.querySelector(`.${expectedClass}`)
    const actualDivText = document.querySelector('.project-tree-node')
      .children[1] as HTMLDivElement

    // Expect
    expect(actualIcon).toBeTruthy()
    expect(actualDivText.innerText).toBe(expectedGroupTitle)
  })

  it('should return icon fa-cube and module title for ComponentNode', () => {
    // Given
    const expectedComponentTitle = 'COMPONENT_TITLE'
    const expectedClass = 'fa-cube'
    const mockComponentNode = getMockedComponentNode({
      moduleTitle: expectedComponentTitle,
    })
    const mockState = getMockedState()

    // When
    document.body.appendChild(render(subject(mockState, mockComponentNode)))
    const actualIcon = document.querySelector(`.${expectedClass}`)
    const actualDivText = document.querySelector('.project-tree-node')
      .children[1] as HTMLDivElement

    // Expect
    expect(actualIcon).toBeTruthy()
    expect(actualDivText.innerText).toBe(expectedComponentTitle)
  })

  it('should return icon fa-puzzel-piece and module title for PluginNode', () => {
    // Given
    const expectedPluginTitle = 'PLUGIN_TITLE'
    const expectedClass = 'fa-puzzle-piece'
    const mockPluginNode = getMockedPluginNode({
      moduleTitle: expectedPluginTitle,
    })
    const mockState = getMockedState()

    // When
    document.body.appendChild(render(subject(mockState, mockPluginNode)))
    const actualIcon = document.querySelector(`.${expectedClass}`)
    const actualDivText = document.querySelector('.project-tree-node')
      .children[1] as HTMLDivElement

    // Expect
    expect(actualIcon).toBeTruthy()
    expect(actualDivText.innerText).toBe(expectedPluginTitle)
  })
})

describe('ProjectTreeView.View', () => {
  let mockState: ProjectTreeView.State
  let subject: ProjectTreeView.View
  let stateMocker

  beforeEach(() => {
    mockState = getMockedState(
      { appStore: { project: { projectName: 'PROJECT_NAME' } } },
      (m) => (stateMocker = m),
    )
    subject = new ProjectTreeView.View({ state: mockState })
  })

  afterEach(() => {
    resetCalls(stateMocker)
  })

  it('should call state.unsubscribe when disconnectedCallback', () => {
    // When
    subject.disconnectedCallback(instance(mock(HTMLElement$)))

    // Expect
    verify(stateMocker.unsubscribe()).once()
  })
})

describe('ProjectTreeView.State', () => {
  const subscriptions = []
  let subject: ProjectTreeView.State
  const uniq = 'UNIQ' + Date.now()
  const nodeIdBuilder = ProjectTreeView.nodeIdBuilderForUniq(uniq)

  // ModuleFlux
  const expectedNodeTitle = 'MODULE_TITLE'
  const expectedNodeModuleId = 'NODE_MODULE_ID'
  const expectedNodeChildrenLength = 1
  const mockModule: ModuleFlux = getMockedModule({
    moduleId: expectedNodeModuleId,
    moduleConfiguration: { title: expectedNodeTitle },
  })
  const expectedNodeId = nodeIdBuilder.buildForModuleId(expectedNodeModuleId)

  // GroupModules.Module, containing Module
  const expectedGroupTitle = 'GROUP_TITLE'
  const expectedGroupModuleId = 'GROUP_MODULE_ID'
  const expectedGroupChildrenLength = 1
  let dynamicGroupModuleTitle = expectedGroupTitle
  const mockGroup: GroupModules.Module = getMockedGroup({
    moduleId: expectedGroupModuleId,
    moduleConfiguration: { title: () => dynamicGroupModuleTitle },
    children: [mockModule],
  })
  const expectedGroupId = nodeIdBuilder.buildForModuleId(expectedGroupModuleId)

  // PluginFlux, attached to ModuleFlux
  const expectedPluginTitle = 'PLUGIN_TITLE'
  const expectedPluginModuleId = 'PLUGIN_MODULE_ID'
  const mockPlugin: PluginFlux<ModuleFlux> = getMockedPlugin({
    moduleId: expectedPluginModuleId,
    moduleConfiguration: { title: expectedPluginTitle },
    parent: mockModule,
  })
  const expectedPluginId = nodeIdBuilder.buildForModuleId(
    expectedPluginModuleId,
  )

  // Root, containing GroupModules.Module and PluginFlux
  const expectedRootTitle = 'ROOT_TITLE'
  const expectedRootChildrenLength = 1
  const mockRootModule: Component.Module = getMockedRootModule({
    moduleConfiguration: { title: expectedRootTitle },
    children: [mockGroup, mockPlugin],
  })
  const expectedRootId = nodeIdBuilder.buildForRootComponent()

  let appStoreSelection$: ReplaySubject<ModuleFlux>
  const appStoreProjectUpdated$: ReplaySubject<WorkflowDelta> =
    new ReplaySubject<WorkflowDelta>()
  let appStoreMocker

  beforeEach(() => {
    appStoreSelection$ = new ReplaySubject<ModuleFlux>(1)
    subject = ProjectTreeView.State.stateForAppStoreAndUniq(
      getMockedAppStore(
        {
          project: {
            workflow: {
              modules: [mockRootModule, mockModule, mockGroup, mockPlugin],
              plugins: [mockPlugin],
            },
          },
          appObservables: {
            moduleSelected: appStoreSelection$,
            projectUpdated: appStoreProjectUpdated$,
          },
        },
        (mocker) => (appStoreMocker = mocker),
      ),
      uniq,
    )
  })

  afterEach(() => {
    subject.unsubscribe()
    subscriptions.forEach((subscription) => subscription.unsubscribe())
    subscriptions.splice(0, subscriptions.length)
  })

  it('should load tree of nodes from appStore', () => {
    // Given
    const expectedExpanded = [nodeIdBuilder.buildForRootComponent()]

    // When
    const actualRootNode = subject.getNode(expectedRootId)

    // Expect root expanded
    expect(subject.expandedNodes$.getValue()).toStrictEqual(expectedExpanded)

    // Expect root
    expect(actualRootNode).toBeDefined()
    expect(actualRootNode).toBeInstanceOf(ComponentNode)
    expect(actualRootNode.id).toContain(expectedRootId)
    expect(actualRootNode.getModuleId()).toBe(Component.rootComponentId)
    expect(actualRootNode.getModuleTitle()).toBe(expectedRootTitle)
    expect(actualRootNode.resolvedChildren()).toBeDefined()
    expect(actualRootNode.resolvedChildren()).toHaveLength(
      expectedRootChildrenLength,
    )

    // Expect GroupNode
    const actualGroup = actualRootNode.resolvedChildren()[0] as GroupNode
    expect(actualGroup).toBeDefined()
    expect(actualGroup).toBeInstanceOf(GroupNode)
    expect(actualGroup.id).toBe(expectedGroupId)
    expect(actualGroup.getModuleId()).toBe(expectedGroupModuleId)
    expect(actualGroup.getModuleTitle()).toBe(expectedGroupTitle)
    expect(actualGroup.resolvedChildren()).toBeDefined()
    expect(actualGroup.resolvedChildren()).toHaveLength(
      expectedGroupChildrenLength,
    )

    // Expect ModuleNode
    const actualChild = actualGroup.resolvedChildren()[0] as ModuleNode
    expect(actualChild).toBeDefined()
    expect(actualChild).toBeInstanceOf(ModuleNode)
    expect(actualChild.id).toBe(expectedNodeId)
    expect(actualChild.getModuleId()).toBe(expectedNodeModuleId)
    expect(actualChild.getModuleTitle()).toBe(expectedNodeTitle)
    expect(actualChild.resolvedChildren()).toBeDefined()
    expect(actualChild.resolvedChildren()).toHaveLength(
      expectedNodeChildrenLength,
    )

    // Expect PluginNode
    const actualPlugin = actualChild.resolvedChildren()[0] as PluginNode
    expect(actualPlugin).toBeDefined()
    expect(actualPlugin).toBeInstanceOf(ModuleNode)
    expect(actualPlugin.id).toBe(expectedPluginId)
    expect(actualPlugin.getModuleId()).toBe(expectedPluginModuleId)
    expect(actualPlugin.getModuleTitle()).toBe(expectedPluginTitle)
    expect(actualPlugin.resolveChildren()).toBeUndefined()
  })

  it('should call appstore.selectModule with focus on node selection', () => {
    // Given
    const nodeSelected = subject.getNode(expectedNodeId)
    when(appStoreMocker.isSelected(expectedNodeModuleId)).thenReturn(false)

    // When
    subject.selectedNode$.next(nodeSelected)

    // Expect
    verify(appStoreMocker.selectModule(expectedNodeModuleId, true)).once()
  })

  it('should not call appstore.selectModule on node selection if module already selected', () => {
    // Given
    const nodeSelected = subject.getNode(expectedNodeId)
    when(appStoreMocker.isSelected(expectedNodeModuleId)).thenReturn(true)

    // When
    subject.selectedNode$.next(nodeSelected)

    // Expect
    verify(appStoreMocker.selectModule(anything(), anything())).never()
  })

  it('should not call appstore.selectModule on root selection', () => {
    // Given
    const nodeSelected = subject.getNode(Component.rootComponentId)
    when(appStoreMocker.isSelected(expectedNodeModuleId)).thenReturn(false)

    // When
    subject.selectedNode$.next(nodeSelected)

    // Expect
    verify(appStoreMocker.selectModule(anything(), anything())).never()
  })

  it('should select node and expand tree in response to appStore module selection', () => {
    // Given
    const firstModuleSelected = mockGroup
    const expectedFirstNodeSelected = expectedGroupId
    const expectedFirstExpansion = [expectedRootId, expectedGroupId]

    const secondModuleSelected = mockPlugin
    const expectedSecondNodeSelected = expectedPluginId
    const expectedSecondExpansion = [
      expectedRootId,
      expectedGroupId,
      expectedNodeId,
      expectedPluginId,
    ]

    const nodesSelected = []
    subscriptions.push(
      subject.selectedNode$.subscribe((node) => {
        nodesSelected.push(node)
      }),
    )

    // When
    appStoreSelection$.next(firstModuleSelected)
    const actualFirstExpansion = subject.expandedNodes$.getValue()
    appStoreSelection$.next(secondModuleSelected)
    const actualSecondExpansion = subject.expandedNodes$.getValue()

    const actualFirstNodeSelected = nodesSelected[0]
    const actualSecondNodeSelected = nodesSelected[1]

    // Expect
    expect(actualFirstExpansion).toStrictEqual(expectedFirstExpansion)
    expect(actualFirstNodeSelected).toBeDefined()
    expect(actualFirstNodeSelected.id).toBe(expectedFirstNodeSelected)

    expect(actualSecondExpansion).toStrictEqual(expectedSecondExpansion)
    expect(actualSecondNodeSelected).toBeDefined()
    expect(actualSecondNodeSelected.id).toBe(expectedSecondNodeSelected)
  })

  it('should rebuild tree in response to appStore project update', () => {
    // Given
    const expectedNewGroupTitle = 'NEW_GROUP_TITLE'

    // When
    const actualOldGroupTitle = subject
      .getNode(expectedGroupId)
      .getModuleTitle()
    dynamicGroupModuleTitle = expectedNewGroupTitle
    appStoreProjectUpdated$.next({
      modules: { createdElements: [], removedElements: [] },
      connections: { createdElements: [], removedElements: [] },
      hasDiff: true,
    })
    const actualNewGroupTitle = subject
      .getNode(expectedGroupId)
      .getModuleTitle()

    // Expect
    expect(actualOldGroupTitle).toBe(expectedGroupTitle)
    expect(actualNewGroupTitle).toBe(expectedNewGroupTitle)
  })

  it('should unsubscribe its own subscriptions', () => {
    // Given
    const observersProjectUpdatedBefore =
      appStoreProjectUpdated$.observers.length
    const observersSelectionBefore = appStoreSelection$.observers.length
    const expectedDeltaObserversProjectUpdate = 1
    const expectedDeltaObserversSelection = 1

    // When
    subject.unsubscribe()
    const actualDeltaObserversProjectUpdate =
      observersProjectUpdatedBefore - appStoreProjectUpdated$.observers.length
    const actualDeltaObserversSelection =
      observersSelectionBefore - appStoreSelection$.observers.length

    // Expect
    expect(actualDeltaObserversProjectUpdate).toBe(
      expectedDeltaObserversProjectUpdate,
    )
    expect(actualDeltaObserversSelection).toBe(expectedDeltaObserversSelection)
  })
})
