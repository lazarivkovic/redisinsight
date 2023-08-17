import { every } from 'lodash'
import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

import AddKey from 'uiSrc/pages/browser/components/add-key/AddKey'
import BulkActions from 'uiSrc/pages/browser/components/bulk-actions'
import CreateRedisearchIndex from 'uiSrc/pages/browser/components/create-redisearch-index/'
import KeyDetailsWrapper from 'uiSrc/pages/browser/components/key-details/KeyDetailsWrapper'

import { updateBrowserTreeSelectedLeaf } from 'uiSrc/slices/app/context'
import {
  keysSelector,
  selectedKeyDataSelector,
  toggleBrowserFullScreen
} from 'uiSrc/slices/browser/keys'
import { RedisResponseBuffer } from 'uiSrc/slices/interfaces'
import { KeyViewType } from 'uiSrc/slices/interfaces/keys'
import { getBasedOnViewTypeEvent, sendEventTelemetry, TelemetryEvent } from 'uiSrc/telemetry'
import { bufferToString, Nullable } from 'uiSrc/utils'

export interface Props {
  selectedKey: Nullable<RedisResponseBuffer>
  setSelectedKey: (keyName: Nullable<RedisResponseBuffer>) => void
  arePanelsCollapsed: boolean
  isAddKeyPanelOpen: boolean
  handleAddKeyPanel: (value: boolean) => void
  isBulkActionsPanelOpen: boolean
  handleBulkActionsPanel: (value: boolean) => void
  isCreateIndexPanelOpen: boolean
  handleCreateIndexPanel?: (value: boolean) => void
  closeRightPanels: () => void
}

const BrowserRightPanel = (props: Props) => {
  const {
    selectedKey,
    arePanelsCollapsed,
    setSelectedKey,
    isAddKeyPanelOpen,
    handleAddKeyPanel,
    isBulkActionsPanelOpen,
    handleBulkActionsPanel,
    isCreateIndexPanelOpen,
    closeRightPanels
  } = props

  const { isBrowserFullScreen, viewType } = useSelector(keysSelector)
  const { type, length } = useSelector(selectedKeyDataSelector) ?? { type: '', length: 0 }

  const { instanceId } = useParams<{ instanceId: string }>()
  const dispatch = useDispatch()

  const closePanel = () => {
    dispatch(toggleBrowserFullScreen(true))

    setSelectedKey(null)
    closeRightPanels()
  }

  const onCloseRedisearchPanel = () => {
    closePanel()
    sendEventTelemetry({
      event: TelemetryEvent.SEARCH_INDEX_ADD_CANCELLED,
      eventData: {
        databaseId: instanceId,
        view: viewType,
      }
    })
  }

  const handleToggleFullScreen = () => {
    dispatch(toggleBrowserFullScreen())

    const browserViewEvent = !isBrowserFullScreen
      ? TelemetryEvent.BROWSER_KEY_DETAILS_FULL_SCREEN_ENABLED
      : TelemetryEvent.BROWSER_KEY_DETAILS_FULL_SCREEN_DISABLED
    const treeViewEvent = !isBrowserFullScreen
      ? TelemetryEvent.TREE_VIEW_KEY_DETAILS_FULL_SCREEN_ENABLED
      : TelemetryEvent.TREE_VIEW_KEY_DETAILS_FULL_SCREEN_DISABLED
    sendEventTelemetry({
      event: getBasedOnViewTypeEvent(viewType, browserViewEvent, treeViewEvent),
      eventData: {
        databaseId: instanceId,
        keyType: type,
        length,
      }
    })
  }

  const handleEditKey = (key: RedisResponseBuffer, newKey: RedisResponseBuffer) => {
    setSelectedKey(newKey)

    if (viewType === KeyViewType.Tree) {
      dispatch(updateBrowserTreeSelectedLeaf({ key: bufferToString(key), newKey: bufferToString(newKey) }))
    }
  }

  const onEditKey = useCallback(
    (key: RedisResponseBuffer, newKey: RedisResponseBuffer) => handleEditKey(key, newKey),
    [],
  )

  const onSelectKey = useCallback(
    () => setSelectedKey(null),
    [],
  )

  return (
    <>
      {every([!isAddKeyPanelOpen, !isBulkActionsPanelOpen, !isCreateIndexPanelOpen], Boolean) && (
        <KeyDetailsWrapper
          isFullScreen={isBrowserFullScreen}
          arePanelsCollapsed={arePanelsCollapsed}
          onToggleFullScreen={handleToggleFullScreen}
          keyProp={selectedKey}
          onCloseKey={closePanel}
          onEditKey={onEditKey}
          onRemoveKey={onSelectKey}
        />
      )}
      {isAddKeyPanelOpen && every([!isBulkActionsPanelOpen, !isCreateIndexPanelOpen], Boolean) && (
        <AddKey
          onAddKeyPanel={handleAddKeyPanel}
          onClosePanel={closePanel}
          arePanelsCollapsed={arePanelsCollapsed}
        />
      )}
      {isBulkActionsPanelOpen && every([!isAddKeyPanelOpen, !isCreateIndexPanelOpen], Boolean) && (
        <BulkActions
          isFullScreen={isBrowserFullScreen}
          arePanelsCollapsed={arePanelsCollapsed}
          onClosePanel={closePanel}
          onBulkActionsPanel={handleBulkActionsPanel}
          onToggleFullScreen={handleToggleFullScreen}
        />
      )}
      {isCreateIndexPanelOpen && every([!isAddKeyPanelOpen, !isBulkActionsPanelOpen], Boolean) && (
        <CreateRedisearchIndex
          arePanelsCollapsed={arePanelsCollapsed}
          onCreateIndex={closePanel}
          onClosePanel={onCloseRedisearchPanel}
        />
      )}
    </>
  )
}

export default React.memo(BrowserRightPanel)
