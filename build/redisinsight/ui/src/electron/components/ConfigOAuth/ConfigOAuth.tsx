import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'

import {
  fetchPlans,
  fetchUserInfo,
  oauthCloudUserDataSelector,
  setJob,
  setOAuthCloudSource,
  setSignInDialogState,
  setSocialDialogState,
  showOAuthProgress,
  signInFailure,
} from 'uiSrc/slices/oauth/cloud'
import { Pages } from 'uiSrc/constants'
import { cloudSelector, fetchSubscriptionsRedisCloud, setIsAutodiscoverySSO } from 'uiSrc/slices/instances/cloud'
import { CloudAuthResponse, CloudAuthStatus, CloudJobName, CloudJobStep } from 'uiSrc/electron/constants'
import { addErrorNotification, addInfiniteNotification, removeInfiniteNotification } from 'uiSrc/slices/app/notifications'
import { parseCloudOAuthError } from 'uiSrc/utils'
import { INFINITE_MESSAGES, InfiniteMessagesIds } from 'uiSrc/components/notifications/components'

const ConfigOAuth = () => {
  const { isAutodiscoverySSO } = useSelector(cloudSelector)
  const userData = useSelector(oauthCloudUserDataSelector)

  const isAutodiscoverySSORef = useRef(isAutodiscoverySSO)

  const history = useHistory()
  const dispatch = useDispatch()

  useEffect(() => {
    window.app?.cloudOauthCallback?.(cloudOauthCallback)

    // delete
    // dispatch(fetchUserInfo(fetchUserInfoSuccess))
  }, [])

  useEffect(() => {
    console.log({ userData })
  }, [userData])

  useEffect(() => {
    isAutodiscoverySSORef.current = isAutodiscoverySSO
  }, [isAutodiscoverySSO])

  const fetchUserInfoSuccess = (isMultiAccount: boolean) => {
    if (isMultiAccount) return

    if (isAutodiscoverySSORef.current) {
      dispatch(fetchSubscriptionsRedisCloud(
        null,
        () => {
          closeInfinityNotification()
          history.push(Pages.redisCloudSubscriptions)
        },
        closeInfinityNotification,
      ))
    } else {
      dispatch(fetchPlans())
    }
  }

  const closeInfinityNotification = () => {
    dispatch(removeInfiniteNotification(InfiniteMessagesIds.oAuthProgress))
  }

  const cloudOauthCallback = (_e: any, { status, message = '', error }: CloudAuthResponse) => {
    if (status === CloudAuthStatus.Succeed) {
      dispatch(setJob({ id: '', name: CloudJobName.CreateFreeDatabase, status: '' }))
      dispatch(showOAuthProgress(true))
      dispatch(addInfiniteNotification(INFINITE_MESSAGES.PENDING_CREATE_DB(CloudJobStep.Credentials)))
      dispatch(setSignInDialogState(null))
      dispatch(setSocialDialogState(null))
      dispatch(fetchUserInfo(fetchUserInfoSuccess, closeInfinityNotification))
    }

    if (status === CloudAuthStatus.Failed) {
      const err = parseCloudOAuthError(error || message || '')
      dispatch(setOAuthCloudSource(null))
      dispatch(signInFailure(err?.message))
      dispatch(addErrorNotification(err))
      dispatch(setIsAutodiscoverySSO(false))
    }
  }

  return null
}

export default ConfigOAuth
