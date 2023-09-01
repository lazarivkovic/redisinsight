import React, { useCallback, useContext, useEffect, useState } from 'react'
import {
  EuiButton,
  EuiIcon,
  EuiModal,
  EuiModalBody,
  EuiSuperSelect,
  EuiSuperSelectOption,
  EuiText,
  EuiTextColor,
  EuiTitle,
} from '@elastic/eui'
import { toNumber, filter, get, find, first } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'
import cx from 'classnames'

import {
  createFreeDbJob,
  oauthCloudPlanSelector,
  oauthCloudSelector,
  setIsOpenSelectPlanDialog,
  setSocialDialogState,
} from 'uiSrc/slices/oauth/cloud'
import { TelemetryEvent, sendEventTelemetry } from 'uiSrc/telemetry'
import { addInfiniteNotification } from 'uiSrc/slices/app/notifications'
import { INFINITE_MESSAGES } from 'uiSrc/components/notifications/components'
import { CloudJobStep } from 'uiSrc/electron/constants'
import { appFeatureFlagsFeaturesSelector } from 'uiSrc/slices/app/features'
import { FeatureFlags, Theme } from 'uiSrc/constants'
import { OAuthSocialSource, TFRegion } from 'uiSrc/slices/interfaces'
import { ThemeContext } from 'uiSrc/contexts/themeContext'
import TriggeredFunctionsDarkSVG from 'uiSrc/assets/img/sidebar/gears.svg'
import TriggeredFunctionsLightSVG from 'uiSrc/assets/img/sidebar/gears_active.svg'

import { CloudSubscriptionPlanResponse } from 'apiSrc/modules/cloud/subscription/dto'
import { OAuthProvider, OAuthProviders } from './constants'
import styles from './styles.module.scss'

export const DEFAULT_REGION = 'us-east-1'
export const DEFAULT_PROVIDER = OAuthProvider.AWS
const getTFProviderRegions = (regions: TFRegion[], provider: OAuthProvider) =>
  (find(regions, { provider }) || {}).regions || []

const OAuthSelectPlan = () => {
  const { theme } = useContext(ThemeContext)
  const { isOpenDialog, data: plansInit = [], loading } = useSelector(oauthCloudPlanSelector)
  const { source } = useSelector(oauthCloudSelector)
  const { [FeatureFlags.cloudSso]: cloudSsoFeature = {} } = useSelector(appFeatureFlagsFeaturesSelector)

  const tfRegions: TFRegion[] = get(cloudSsoFeature, 'data.selectPlan.components.triggersAndFunctions', [])

  const [plans, setPlans] = useState(plansInit || [])
  const [planIdSelected, setPlanIdSelected] = useState('')
  const [providerSelected, setProviderSelected] = useState<OAuthProvider>(DEFAULT_PROVIDER)
  const [tfProviderRegions, setTfProviderRegions] = useState(getTFProviderRegions(tfRegions, providerSelected))

  const dispatch = useDispatch()

  const isTFSource = source?.endsWith(OAuthSocialSource.TriggersAndFunctions)

  useEffect(() => {
    setTfProviderRegions(getTFProviderRegions(tfRegions, providerSelected))
  }, [providerSelected])

  useEffect(() => {
    if (!plansInit.length) {
      return
    }

    const defaultRegions = isTFSource ? tfProviderRegions || [DEFAULT_REGION] : [DEFAULT_REGION]

    const filteredPlans = filter(plansInit, { provider: providerSelected })
      .sort((a, b) => (a?.details?.displayOrder || 0) - (b?.details?.displayOrder || 0))

    const defaultPlan = filteredPlans.find(({ region = '' }) => defaultRegions?.includes(region))

    const planId = (defaultPlan || first(filteredPlans) || {}).id?.toString() || ''

    setPlans(filteredPlans)
    setPlanIdSelected(planId)
  }, [isTFSource, plansInit, providerSelected, tfProviderRegions])

  const handleOnClose = useCallback(() => {
    sendEventTelemetry({
      event: TelemetryEvent.CLOUD_SIGN_IN_PROVIDER_FORM_CLOSED,
    })
    setPlanIdSelected('')
    setProviderSelected(DEFAULT_PROVIDER)
    dispatch(setIsOpenSelectPlanDialog(false))
    dispatch(setSocialDialogState(null))
  }, [])

  if (!isOpenDialog) return null

  const getOptionDisplay = (item: CloudSubscriptionPlanResponse) => {
    const { region = '', details: { countryName = '', cityName = '' }, provider } = item
    const tfProviderRegions: string[] = find(tfRegions, { provider })?.regions || []

    return (
      <EuiText color="subdued" size="s">
        {`${countryName} (${cityName})`}
        <EuiTextColor className={styles.regionName}>{region}</EuiTextColor>
        { tfProviderRegions?.includes(region) && (
          <EuiIcon
            type={theme === Theme.Dark ? TriggeredFunctionsDarkSVG : TriggeredFunctionsLightSVG}
            className={styles.tfOptionIcon}
            data-testid={`tf-icon-${region}`}
          />
        )}
      </EuiText>
    )
  }

  const regionOptions: EuiSuperSelectOption<string>[] = plans.map(
    (item) => {
      const { id, region = '' } = item
      return {
        value: `${id}`,
        inputDisplay: getOptionDisplay(item),
        dropdownDisplay: getOptionDisplay(item),
        'data-test-subj': `oauth-region-${region}`,
      }
    }
  )

  const isVendorWithTFRegions = !!regionOptions.length
    && !plans.some(({ region = '' }) => tfProviderRegions?.includes(region))

  const onChangeRegion = (region: string) => {
    setPlanIdSelected(region)
  }

  const handleSubmit = () => {
    dispatch(createFreeDbJob(toNumber(planIdSelected),
      () => {
        dispatch(setIsOpenSelectPlanDialog(false))
        dispatch(addInfiniteNotification(INFINITE_MESSAGES.PENDING_CREATE_DB(CloudJobStep.Credentials)))
      }))
  }

  return (
    <EuiModal className={styles.container} onClose={handleOnClose} data-testid="oauth-select-plan-dialog">
      <EuiModalBody className={styles.modalBody}>
        <section className={styles.content}>
          <EuiText className={styles.subTitle}>
            Redis Enterprise Cloud
          </EuiText>
          <EuiTitle size="s">
            <h2 className={styles.title}>Select cloud vendor</h2>
          </EuiTitle>
          <section className={styles.providers}>
            { OAuthProviders.map(({ icon, id, label }) => (
              <div className={styles.provider}>
                {id === providerSelected
                  && <div className={cx(styles.providerActiveIcon)}><EuiIcon type="check" /></div>}
                <EuiButton
                  iconType={icon}
                  onClick={() => setProviderSelected(id)}
                  className={cx(styles.providerBtn, { [styles.activeProvider]: id === providerSelected })}
                />
                <EuiText className={styles.providerLabel}>{label}</EuiText>
              </div>
            )) }
          </section>
          <section className={styles.region}>
            <EuiText className={styles.regionLabel}>Region</EuiText>
            <EuiSuperSelect
              fullWidth
              itemClassName={styles.regionSelectItem}
              className={styles.regionSelect}
              disabled={loading || !regionOptions.length}
              isLoading={loading}
              options={regionOptions}
              valueOfSelected={planIdSelected}
              onChange={onChangeRegion}
              data-testid="select-oauth-region"
            />
            {isVendorWithTFRegions && (
              <EuiText className={styles.selectDescription} data-testid="select-region-select-description">
                This vendor does not support triggers and functions capability.
              </EuiText>
            )}
            {!regionOptions.length && (
              <EuiText className={styles.selectDescription} data-testid="select-region-select-description">
                No regions available, try another vendor.
              </EuiText>
            )}
          </section>
          <footer className={styles.footer}>
            <EuiButton
              className={styles.button}
              onClick={handleOnClose}
              data-testid="close-oauth-select-plan-dialog"
              aria-labelledby="close oauth select plan dialog"
            >
              Cancel
            </EuiButton>
            <EuiButton
              fill
              isDisabled={loading || !planIdSelected}
              isLoading={loading}
              color="secondary"
              className={styles.button}
              onClick={handleSubmit}
              data-testid="submit-oauth-select-plan-dialog"
              aria-labelledby="submit oauth select plan dialog"
            >
              Create database
            </EuiButton>
          </footer>
        </section>
      </EuiModalBody>
    </EuiModal>
  )
}

export default OAuthSelectPlan
