/* eslint-disable sonarjs/no-duplicate-string */
import { cloneDeep } from 'lodash'
import React from 'react'
import MockedSocket from 'socket.io-mock'
import socketIO from 'socket.io-client'
import { NotificationEvent } from 'uiSrc/constants/notifications'
import { setNewNotificationReceived, setLastReceivedNotification } from 'uiSrc/slices/app/notifications'
import { setIsConnected } from 'uiSrc/slices/app/socket-connection'
import { NotificationType } from 'uiSrc/slices/interfaces'
import { cleanup, mockedStore, render } from 'uiSrc/utils/test-utils'
import { SocketEvent } from 'uiSrc/constants'
import { connectedInstanceSelector } from 'uiSrc/slices/instances/instances'
import { RecommendationsSocketEvents } from 'uiSrc/constants/recommendations'
import { setTotalUnread } from 'uiSrc/slices/recommendations/recommendations'
import { NotificationsDto } from 'apiSrc/modules/notification/dto'

import CommonAppSubscription from './CommonAppSubscription'

let store: typeof mockedStore
let socket: typeof MockedSocket
beforeEach(() => {
  cleanup()
  socket = new MockedSocket()
  socketIO.mockReturnValue(socket)
  store = cloneDeep(mockedStore)
  store.clearActions()
})

jest.mock('socket.io-client')

jest.mock('uiSrc/slices/instances/instances', () => ({
  ...jest.requireActual('uiSrc/slices/instances/instances'),
  connectedInstanceSelector: jest.fn().mockReturnValue({
    id: jest.fn().mockReturnValue(''),
    connectionType: 'STANDALONE',
    db: 0,
  }),
}))

describe('CommonAppSubscription', () => {
  it('should render', () => {
    expect(render(<CommonAppSubscription />)).toBeTruthy()
  })

  it('should connect socket', () => {
    const { unmount } = render(<CommonAppSubscription />)

    socket.socketClient.emit(SocketEvent.Connect)

    const afterRenderActions = [
      setIsConnected(true)
    ]
    expect(store.getActions()).toEqual([...afterRenderActions])

    unmount()
  })

  it('should set notifications', () => {
    const { unmount } = render(<CommonAppSubscription />)

    const mockData: NotificationsDto = {
      notifications: [
        {
          type: NotificationType.Global,
          timestamp: 123123125,
          title: 'string',
          body: 'string',
          read: false,
        },
      ],
      totalUnread: 1
    }

    socket.on(NotificationEvent.Notification, (data: NotificationsDto) => {
      expect(data).toEqual(mockData)
    })

    socket.socketClient.emit(NotificationEvent.Notification, mockData)

    const afterRenderActions = [
      setNewNotificationReceived(mockData as NotificationsDto),
      setLastReceivedNotification(null),
    ]
    expect(store.getActions()).toEqual([...afterRenderActions])

    unmount()
  })

  it('should call proper actions after emit recommendation', async () => {
    (connectedInstanceSelector as jest.Mock).mockReturnValueOnce({
      id: '123',
      connectionType: 'STANDALONE',
      db: 0,
    })

    const { unmount } = render(<CommonAppSubscription />)
    const mockData = { totalUnread: 10 }
    const mockData2 = { totalUnread: 20 }

    socket.socketClient.emit(`${RecommendationsSocketEvents.Recommendation}:123`, mockData)
    socket.socketClient.emit(`${RecommendationsSocketEvents.Recommendation}:123`, mockData2)

    const afterRenderActions = [
      setTotalUnread(10),
      setTotalUnread(20),
    ]
    expect(store.getActions()).toEqual([...afterRenderActions])

    unmount()
  })
})
