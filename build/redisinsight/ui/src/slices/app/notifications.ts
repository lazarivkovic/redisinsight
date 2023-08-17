import { createSlice, current } from '@reduxjs/toolkit'
import { AxiosError } from 'axios'
import { isUndefined } from 'lodash'
import { ApiEndpoints } from 'uiSrc/constants'
import { apiService } from 'uiSrc/services'
import { getApiErrorMessage, getApiErrorName, isStatusSuccessful, Maybe, Nullable } from 'uiSrc/utils'
import { NotificationsDto, NotificationDto } from 'apiSrc/modules/notification/dto'
import { StateAppNotifications } from '../interfaces'

import { AppDispatch, RootState } from '../store'

export const initialState: StateAppNotifications = {
  errors: [],
  messages: [],
  notificationCenter: {
    loading: false,
    lastReceivedNotification: null,
    notifications: [],
    isNotificationOpen: false,
    isCenterOpen: false,
    totalUnread: 0,
    shouldDisplayToast: false,
  }
}

export interface IAddInstanceErrorPayload extends AxiosError {
  instanceId?: string,
}
// A slice for recipes
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addErrorNotification: (state, { payload }: { payload: IAddInstanceErrorPayload }) => {
      const { instanceId } = payload
      const errorName = getApiErrorName(payload)
      const message = getApiErrorMessage(payload)
      const errorExistedId = state.errors.findIndex(
        (err) => err.message === message
      )

      if (errorExistedId !== -1) {
        notificationsSlice.caseReducers.removeError(state, {
          payload: current(state.errors[errorExistedId])?.id ?? '',
        })
      }

      state.errors.push({
        ...payload,
        instanceId,
        id: `${Date.now()}`,
        name: errorName,
        message,
      })
    },
    removeError: (state, { payload = '' }: { payload: string }) => {
      state.errors = state.errors.filter((error) => error.id !== payload)
    },
    resetErrors: (state) => {
      state.errors = []
    },
    addMessageNotification: (state, { payload }) => {
      state.messages.push({
        ...payload,
        id: `${Date.now()}`,
        group: payload.group
      })
    },
    removeMessage: (state, { payload = '' }: { payload: string }) => {
      state.messages = state.messages.filter((message) => message.id !== payload)
      state.errors = state.errors.filter((error) => error.id !== payload)
    },
    resetMessages: (state) => {
      state.messages = []
    },
    setIsCenterOpen: (state, { payload }: { payload: Maybe<boolean> }) => {
      if (isUndefined(payload)) {
        state.notificationCenter.isCenterOpen = !state.notificationCenter.isCenterOpen
        return
      }
      state.notificationCenter.isCenterOpen = payload
    },
    setIsNotificationOpen: (state, { payload }: { payload: Maybe<boolean> }) => {
      if (isUndefined(payload)) {
        state.notificationCenter.isNotificationOpen = !state.notificationCenter.isNotificationOpen
        return
      }
      state.notificationCenter.isNotificationOpen = payload
    },
    setNewNotificationReceived: (state, { payload }: { payload: NotificationsDto }) => {
      state.notificationCenter.totalUnread = payload.totalUnread
      state.notificationCenter.isNotificationOpen = true
    },
    setLastReceivedNotification: (state, { payload }: { payload: Nullable<NotificationDto> }) => {
      state.notificationCenter.lastReceivedNotification = payload
    },
    getNotifications: (state) => {
      state.notificationCenter.loading = true
    },
    getNotificationsSuccess: (state, { payload }: { payload: NotificationsDto }) => {
      state.notificationCenter.loading = false
      state.notificationCenter.notifications = payload.notifications
      state.notificationCenter.totalUnread = payload.totalUnread
    },
    getNotificationsFailed: (state) => {
      state.notificationCenter.loading = false
    },
    unreadNotifications: (state, { payload }) => {
      state.notificationCenter.totalUnread = payload
    }
  },
})

// Actions generated from the slice
export const {
  addErrorNotification,
  removeError,
  resetErrors,
  addMessageNotification,
  removeMessage,
  resetMessages,
  setIsCenterOpen,
  setIsNotificationOpen,
  setNewNotificationReceived,
  setLastReceivedNotification,
  getNotifications,
  getNotificationsSuccess,
  getNotificationsFailed,
  unreadNotifications
} = notificationsSlice.actions

// Selectors
export const errorsSelector = (state: RootState) =>
  state.app.notifications.errors
export const messagesSelector = (state: RootState) =>
  state.app.notifications.messages
export const notificationCenterSelector = (state: RootState) =>
  state.app.notifications.notificationCenter

// The reducer
export default notificationsSlice.reducer

export function fetchNotificationsAction(
  onSuccessAction?: (totalCount: number, numberOfNotifications: number) => void,
  onFailAction?: () => void
) {
  return async (dispatch: AppDispatch) => {
    dispatch(getNotifications())

    try {
      const { data, status } = await apiService.get<NotificationsDto>(
        ApiEndpoints.NOTIFICATIONS
      )

      if (isStatusSuccessful(status)) {
        dispatch(getNotificationsSuccess(data))
        onSuccessAction?.(data.totalUnread, data.notifications?.length)
      }
    } catch (error) {
      dispatch(getNotificationsFailed())
      onFailAction?.()
    }
  }
}

export function unreadNotificationsAction(notification?: { timestamp: number, type: string }) {
  return async (dispatch: AppDispatch) => {
    try {
      const { data, status } = await apiService.patch(
        ApiEndpoints.NOTIFICATIONS_READ,
        notification
      )

      if (isStatusSuccessful(status)) {
        dispatch(unreadNotifications(data.totalUnread))
      }
    } catch (error) {
      //
    }
  }
}

export function setNewNotificationAction(
  data: NotificationsDto,
) {
  return (dispatch: AppDispatch, stateInit: () => RootState) => {
    const state = stateInit()
    dispatch(setNewNotificationReceived(data))
    const toastNotification = state.user.settings.config?.agreements?.notifications
      ? data.notifications[0]
      : null
    dispatch(setLastReceivedNotification(toastNotification))
  }
}
