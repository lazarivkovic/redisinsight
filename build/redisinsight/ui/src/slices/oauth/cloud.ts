import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AxiosError } from 'axios'
import { remove } from 'lodash'
import { apiService, localStorageService } from 'uiSrc/services'
import { ApiEndpoints, BrowserStorageItem, Pages } from 'uiSrc/constants'
import { getApiErrorMessage, getAxiosError, isStatusSuccessful, Nullable } from 'uiSrc/utils'

import { CloudJobName, CloudJobStatus } from 'uiSrc/electron/constants'
import {
  INFINITE_MESSAGES,
  InfiniteMessagesIds
} from 'uiSrc/components/notifications/components'
import successMessages from 'uiSrc/components/notifications/success-messages'
import { CloudUser } from 'apiSrc/modules/cloud/user/models'
import { CloudJobInfo } from 'apiSrc/modules/cloud/job/models'
import { CloudSubscriptionPlanResponse } from 'apiSrc/modules/cloud/subscription/dto'

import { AppDispatch, RootState } from '../store'
import {
  CloudCapiKey,
  CloudJobInfoState,
  EnhancedAxiosError,
  Instance,
  OAuthSocialSource,
  StateAppOAuth
} from '../interfaces'
import {
  addErrorNotification,
  addInfiniteNotification,
  addMessageNotification,
  removeInfiniteNotification
} from '../app/notifications'
import { checkConnectToInstanceAction, setConnectedInstanceId } from '../instances/instances'
import { setAppContextInitialState } from '../app/context'

export const initialState: StateAppOAuth = {
  loading: false,
  error: '',
  message: '',
  job: {
    id: localStorageService.get(BrowserStorageItem.OAuthJobId) ?? '',
    name: CloudJobName.CreateFreeDatabase,
    status: '',
  },
  source: null,
  agreement: localStorageService.get(BrowserStorageItem.OAuthAgreement) ?? false,
  isOpenSocialDialog: false,
  isOpenSignInDialog: false,
  isOpenSelectAccountDialog: false,
  showProgress: true,
  user: {
    loading: false,
    error: '',
    data: null,
    freeDb: {
      loading: false,
      error: '',
      data: null,
    },
  },
  plan: {
    loading: false,
    isOpenDialog: false,
    data: [],
  },
  capiKeys: {
    loading: false,
    data: null
  }
}

// A slice for recipes
const oauthCloudSlice = createSlice({
  name: 'oauthCloud',
  initialState,
  reducers: {
    setOAuthInitialState: () => initialState,

    signIn: (state) => {
      state.loading = true
    },
    signInSuccess: (state, { payload }: PayloadAction<string>) => {
      state.loading = false
      state.error = ''
      state.message = payload
    },
    signInFailure: (state, { payload }: PayloadAction<string>) => {
      state.loading = false
      state.error = payload
    },
    getUserInfo: (state) => {
      state.user.loading = true
    },
    getUserInfoSuccess: (state, { payload }: PayloadAction<CloudUser>) => {
      state.user.loading = false
      state.user.data = payload
    },
    getUserInfoFailure: (state, { payload }: PayloadAction<string>) => {
      state.user.loading = false
      state.user.error = payload
    },
    addFreeDb: (state) => {
      state.user.freeDb.loading = true
    },
    addFreeDbSuccess: (state, { payload }: PayloadAction<Instance>) => {
      state.user.freeDb.loading = false
      state.user.freeDb.data = payload
    },
    addFreeDbFailure: (state, { payload }: PayloadAction<string>) => {
      state.user.freeDb.loading = false
      state.user.freeDb.error = payload
    },
    setSocialDialogState: (state, { payload }: PayloadAction<Nullable<OAuthSocialSource>>) => {
      if (payload) {
        state.source = payload
      }
      state.isOpenSocialDialog = !!payload
    },
    setSignInDialogState: (state, { payload }: PayloadAction<Nullable<OAuthSocialSource>>) => {
      if (payload) {
        state.source = payload
      }
      state.isOpenSignInDialog = !!payload
    },
    setOAuthCloudSource: (state, { payload }: PayloadAction<Nullable<OAuthSocialSource>>) => {
      state.source = payload
    },
    setSelectAccountDialogState: (state, { payload }: PayloadAction<boolean>) => {
      state.isOpenSelectAccountDialog = payload
    },
    setJob: (state, { payload }: PayloadAction<CloudJobInfoState>) => {
      state.job = payload
    },

    // Select Plan
    setIsOpenSelectPlanDialog: (state, { payload }: PayloadAction<boolean>) => {
      state.plan.isOpenDialog = payload
    },
    getPlans: (state) => {
      state.plan.loading = true
    },
    getPlansSuccess: (state, { payload }: PayloadAction<any[]>) => {
      state.plan.loading = false
      state.plan.data = payload
    },
    getPlansFailure: (state) => {
      state.plan.loading = false
    },
    showOAuthProgress: (state, { payload }: PayloadAction<boolean>) => {
      state.showProgress = payload
    },
    setAgreement: (state, { payload }: PayloadAction<boolean>) => {
      state.agreement = payload
    },
    getCapiKeys: (state) => {
      state.capiKeys.loading = true
    },
    getCapiKeysSuccess: (state, { payload }: PayloadAction<CloudCapiKey[]>) => {
      state.capiKeys.loading = false
      state.capiKeys.data = payload
    },
    getCapiKeysFailure: (state) => {
      state.capiKeys.loading = false
    },
    removeCapiKey: (state) => {
      state.capiKeys.loading = true
    },
    removeCapiKeySuccess: (state, { payload }: PayloadAction<string>) => {
      state.capiKeys.loading = false
      if (state.capiKeys.data) {
        remove(state.capiKeys.data, (item) => item.id === payload)
      }
    },
    removeCapiKeyFailure: (state) => {
      state.capiKeys.loading = false
    },
    removeAllCapiKeys: (state) => {
      state.capiKeys.loading = true
    },
    removeAllCapiKeysSuccess: (state) => {
      state.capiKeys.loading = false
      state.capiKeys.data = []
    },
    removeAllCapiKeysFailure: (state) => {
      state.capiKeys.loading = false
    },
  },
})

// Actions generated from the slice
export const {
  setOAuthInitialState,
  signIn,
  signInSuccess,
  signInFailure,
  getUserInfo,
  getUserInfoSuccess,
  getUserInfoFailure,
  addFreeDb,
  addFreeDbSuccess,
  addFreeDbFailure,
  setSocialDialogState,
  setSignInDialogState,
  setOAuthCloudSource,
  setSelectAccountDialogState,
  setJob,
  setIsOpenSelectPlanDialog,
  getPlans,
  getPlansSuccess,
  getPlansFailure,
  showOAuthProgress,
  setAgreement,
  getCapiKeys,
  getCapiKeysSuccess,
  getCapiKeysFailure,
  removeCapiKey,
  removeCapiKeySuccess,
  removeCapiKeyFailure,
  removeAllCapiKeys,
  removeAllCapiKeysSuccess,
  removeAllCapiKeysFailure,
} = oauthCloudSlice.actions

// A selector
export const oauthCloudSelector = (state: RootState) => state.oauth.cloud
export const oauthCloudJobSelector = (state: RootState) => state.oauth.cloud.job
export const oauthCloudUserSelector = (state: RootState) => state.oauth.cloud.user
export const oauthCloudUserDataSelector = (state: RootState) => state.oauth.cloud.user.data
export const oauthCloudPlanSelector = (state: RootState) => state.oauth.cloud.plan
export const oauthCloudPAgreementSelector = (state: RootState) => state.oauth.cloud.agreement
export const oauthCapiKeysSelector = (state: RootState) => state.oauth.cloud.capiKeys

// The reducer
export default oauthCloudSlice.reducer

export function createFreeDbSuccess(id: string, history: any) {
  return async (dispatch: AppDispatch) => {
    try {
      const onConnect = () => {
        dispatch(setAppContextInitialState())
        dispatch(setConnectedInstanceId(id ?? ''))
        dispatch(removeInfiniteNotification(InfiniteMessagesIds.oAuthSuccess))
        dispatch(checkConnectToInstanceAction(id))

        history.push(Pages.home)
        setTimeout(() => {
          history.push(Pages.workbench(id))
        }, 0)
      }

      dispatch(showOAuthProgress(true))
      dispatch(removeInfiniteNotification(InfiniteMessagesIds.oAuthProgress))
      dispatch(addInfiniteNotification(INFINITE_MESSAGES.SUCCESS_CREATE_DB(onConnect)))
      dispatch(setSelectAccountDialogState(false))
    } catch (_err) {
      const error = _err as AxiosError
      const errorMessage = getApiErrorMessage(error)
      dispatch(setOAuthCloudSource(null))
      dispatch(addErrorNotification(error))
      dispatch(addFreeDbFailure(errorMessage))
    }
  }
}

// Asynchronous thunk action
export function fetchUserInfo(onSuccessAction?: (isMultiAccount: boolean) => void, onFailAction?: () => void) {
  return async (dispatch: AppDispatch) => {
    dispatch(getUserInfo())

    try {
      const { data, status } = await apiService.get<CloudUser>(ApiEndpoints.CLOUD_ME)

      if (isStatusSuccessful(status)) {
        const isMultiAccount = (data?.accounts?.length ?? 0) > 1
        if (isMultiAccount) {
          dispatch(setSelectAccountDialogState(true))
          dispatch(removeInfiniteNotification(InfiniteMessagesIds.oAuthProgress))
        }

        dispatch(getUserInfoSuccess(data))
        dispatch(setSignInDialogState(null))

        onSuccessAction?.(isMultiAccount)
      }
    } catch (_err) {
      const error = _err as AxiosError
      const errorMessage = getApiErrorMessage(error)
      dispatch(addErrorNotification(error))
      dispatch(getUserInfoFailure(errorMessage))
      dispatch(setOAuthCloudSource(null))

      onFailAction?.()
    }
  }
}

// Asynchronous thunk action
export function createFreeDbJob(planId: number, onSuccessAction?: () => void, onFailAction?: () => void) {
  return async (dispatch: AppDispatch) => {
    dispatch(addFreeDb())

    try {
      const { data, status } = await apiService.post<CloudJobInfo>(
        ApiEndpoints.CLOUD_ME_JOBS,
        {
          name: CloudJobName.CreateFreeDatabase,
          runMode: 'async',
          data: { planId },
        }
      )

      if (isStatusSuccessful(status)) {
        localStorageService.set(BrowserStorageItem.OAuthJobId, data.id)
        dispatch(setJob({ id: data.id, name: CloudJobName.CreateFreeDatabase, status: CloudJobStatus.Running }))
        onSuccessAction?.()
      }
    } catch (_err) {
      const error = _err as AxiosError
      const errorMessage = getApiErrorMessage(error)
      dispatch(addErrorNotification(error))
      dispatch(addFreeDbFailure(errorMessage))
      dispatch(setOAuthCloudSource(null))
      onFailAction?.()
    }
  }
}

// Asynchronous thunk action
export function activateAccount(
  id: string,
  onSuccessAction?: () => void,
  onFailAction?: (error: string) => void
) {
  return async (dispatch: AppDispatch) => {
    dispatch(getUserInfo())

    try {
      const { data, status } = await apiService.put<CloudUser>(
        [
          ApiEndpoints.CLOUD_ME_ACCOUNTS,
          id,
          ApiEndpoints.CLOUD_CURRENT,
        ].join('/'),
      )

      if (isStatusSuccessful(status)) {
        dispatch(getUserInfoSuccess(data))
        onSuccessAction?.()
      }
    } catch (_err) {
      const error = _err as AxiosError
      const errorMessage = getApiErrorMessage(error)
      dispatch(addErrorNotification(error))
      dispatch(getUserInfoFailure(errorMessage))
      dispatch(setOAuthCloudSource(null))
      onFailAction?.(errorMessage)
    }
  }
}

// Asynchronous thunk action
export function fetchPlans(onSuccessAction?: () => void, onFailAction?: () => void) {
  return async (dispatch: AppDispatch) => {
    dispatch(getPlans())

    try {
      const { data, status } = await apiService.get<CloudSubscriptionPlanResponse[]>(
        ApiEndpoints.CLOUD_SUBSCRIPTION_PLANS
      )

      if (isStatusSuccessful(status)) {
        dispatch(getPlansSuccess(data))
        dispatch(setIsOpenSelectPlanDialog(true))
        dispatch(setSignInDialogState(null))
        dispatch(setSelectAccountDialogState(false))
        dispatch(removeInfiniteNotification(InfiniteMessagesIds.oAuthProgress))

        onSuccessAction?.()
      }
    } catch (error) {
      const err = getAxiosError(error as EnhancedAxiosError)

      dispatch(addErrorNotification(err))
      dispatch(getPlansFailure())
      dispatch(removeInfiniteNotification(InfiniteMessagesIds.oAuthProgress))
      dispatch(setOAuthCloudSource(null))
      onFailAction?.()
    }
  }
}

// Asynchronous thunk action
export function getCapiKeysAction(onSuccessAction?: () => void, onFailAction?: () => void) {
  return async (dispatch: AppDispatch) => {
    dispatch(getCapiKeys())

    try {
      const { data, status } = await apiService.get<CloudCapiKey[]>(
        ApiEndpoints.CLOUD_CAPI_KEYS
      )

      if (isStatusSuccessful(status)) {
        dispatch(getCapiKeysSuccess(data))
        onSuccessAction?.()
      }
    } catch (_err) {
      const error = _err as AxiosError
      dispatch(addErrorNotification(error))
      dispatch(getCapiKeysFailure())
      onFailAction?.()
    }
  }
}

// Asynchronous thunk action
export function removeAllCapiKeysAction(onSuccessAction?: () => void, onFailAction?: () => void) {
  return async (dispatch: AppDispatch) => {
    dispatch(removeAllCapiKeys())

    try {
      const { status } = await apiService.delete(
        ApiEndpoints.CLOUD_CAPI_KEYS
      )

      if (isStatusSuccessful(status)) {
        dispatch(removeAllCapiKeysSuccess())
        dispatch(addMessageNotification(successMessages.REMOVED_ALL_CAPI_KEYS()))
        onSuccessAction?.()
      }
    } catch (_err) {
      const error = _err as AxiosError
      dispatch(addErrorNotification(error))
      dispatch(removeAllCapiKeysFailure())
      onFailAction?.()
    }
  }
}

// Asynchronous thunk action
export function removeCapiKeyAction(
  { id, name }: { id: string, name: string },
  onSuccessAction?: () => void,
  onFailAction?: () => void
) {
  return async (dispatch: AppDispatch) => {
    dispatch(removeCapiKey())

    try {
      const { status } = await apiService.delete(
        `${ApiEndpoints.CLOUD_CAPI_KEYS}/${id}`
      )

      if (isStatusSuccessful(status)) {
        dispatch(removeCapiKeySuccess(id))
        dispatch(addMessageNotification(successMessages.REMOVED_CAPI_KEY(name)))
        onSuccessAction?.()
      }
    } catch (_err) {
      const error = _err as AxiosError
      dispatch(addErrorNotification(error))
      dispatch(removeCapiKeyFailure())
      onFailAction?.()
    }
  }
}
