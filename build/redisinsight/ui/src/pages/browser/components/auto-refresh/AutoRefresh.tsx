import React, { useEffect, useState } from 'react'
import { EuiButtonIcon, EuiIcon, EuiPopover, EuiSwitch, EuiTextColor, EuiToolTip } from '@elastic/eui'
import cx from 'classnames'

import { EuiButtonIconSizes } from '@elastic/eui/src/components/button/button_icon/button_icon'
import {
  errorValidateRefreshRateNumber,
  MIN_REFRESH_RATE,
  Nullable,
  validateRefreshRateNumber
} from 'uiSrc/utils'
import InlineItemEditor from 'uiSrc/components/inline-item-editor'
import { localStorageService } from 'uiSrc/services'
import { BrowserStorageItem } from 'uiSrc/constants'
import {
  getTextByRefreshTime,
  DEFAULT_REFRESH_RATE,
  DURATION_FIRST_REFRESH_TIME,
  MINUTE,
  NOW,
} from './utils'

import styles from './styles.module.scss'

export interface Props {
  postfix: string
  loading: boolean
  displayText?: boolean
  lastRefreshTime: Nullable<number>
  testid?: string
  containerClassName?: string
  turnOffAutoRefresh?: boolean
  onRefresh: (enableAutoRefresh: boolean) => void
  onRefreshClicked?: () => void
  onEnableAutoRefresh?: (enableAutoRefresh: boolean, refreshRate: string) => void
  onChangeAutoRefreshRate?: (enableAutoRefresh: boolean, refreshRate: string) => void
  iconSize?: EuiButtonIconSizes
  disabled?: boolean
}

const TIMEOUT_TO_UPDATE_REFRESH_TIME = 1_000 * MINUTE // once a minute

const AutoRefresh = ({
  postfix,
  loading,
  displayText = true,
  lastRefreshTime,
  containerClassName = '',
  testid = '',
  turnOffAutoRefresh,
  onRefresh,
  onRefreshClicked,
  onEnableAutoRefresh,
  onChangeAutoRefreshRate,
  iconSize = 'm',
  disabled,
}: Props) => {
  let intervalText: NodeJS.Timeout
  let intervalRefresh: NodeJS.Timeout

  const [refreshMessage, setRefreshMessage] = useState(NOW)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [refreshRate, setRefreshRate] = useState<string>('')
  const [refreshRateMessage, setRefreshRateMessage] = useState<string>('')
  const [enableAutoRefresh, setEnableAutoRefresh] = useState(false)
  const [editingRate, setEditingRate] = useState(false)

  const onButtonClick = () => setIsPopoverOpen((isPopoverOpen) => !isPopoverOpen)
  const closePopover = () => {
    setEnableAutoRefresh(enableAutoRefresh)
    setIsPopoverOpen(false)
  }

  useEffect(() => {
    const refreshRateStorage = localStorageService.get(BrowserStorageItem.autoRefreshRate + postfix)
      || DEFAULT_REFRESH_RATE

    setRefreshRate(refreshRateStorage)
  }, [postfix])

  useEffect(() => {
    if (turnOffAutoRefresh && enableAutoRefresh) {
      setEnableAutoRefresh(false)
      clearInterval(intervalRefresh)
    }
  }, [turnOffAutoRefresh])

  // update refresh label text
  useEffect(() => {
    const delta = getLastRefreshDelta(lastRefreshTime)
    updateLastRefresh()

    intervalText = setInterval(() => {
      if (document.hidden) return

      updateLastRefresh()
    }, delta < DURATION_FIRST_REFRESH_TIME ? DURATION_FIRST_REFRESH_TIME : TIMEOUT_TO_UPDATE_REFRESH_TIME)
    return () => clearInterval(intervalText)
  }, [lastRefreshTime])

  // refresh interval
  useEffect(() => {
    updateLastRefresh()

    if (enableAutoRefresh && !loading) {
      intervalRefresh = setInterval(() => {
        if (document.hidden) return

        handleRefresh()
      }, +refreshRate * 1_000)
    } else {
      clearInterval(intervalRefresh)
    }

    if (enableAutoRefresh) {
      updateAutoRefreshText(refreshRate)
    }

    return () => clearInterval(intervalRefresh)
  }, [enableAutoRefresh, refreshRate, loading, lastRefreshTime])

  const getLastRefreshDelta = (time:Nullable<number>) => (Date.now() - (time || 0)) / 1_000

  const updateLastRefresh = () => {
    const delta = getLastRefreshDelta(lastRefreshTime)
    const text = getTextByRefreshTime(delta, lastRefreshTime ?? 0)

    lastRefreshTime && setRefreshMessage(text)
  }

  const updateAutoRefreshText = (refreshRate: string) => {
    enableAutoRefresh && setRefreshRateMessage(
      // more than 1 minute
      +refreshRate > MINUTE ? `${Math.floor(+refreshRate / MINUTE)} min` : `${refreshRate} s`
    )
  }

  const handleApplyAutoRefreshRate = (initValue: string) => {
    const value = +initValue >= MIN_REFRESH_RATE ? initValue : `${MIN_REFRESH_RATE}`
    setRefreshRate(value)
    setEditingRate(false)
    localStorageService.set(BrowserStorageItem.autoRefreshRate + postfix, value)
    onChangeAutoRefreshRate?.(enableAutoRefresh, value)
  }

  const handleDeclineAutoRefreshRate = () => {
    setEditingRate(false)
  }

  const handleRefresh = () => {
    onRefresh(enableAutoRefresh)
  }

  const handleRefreshClick = () => {
    handleRefresh()
    onRefreshClicked?.()
  }

  const onChangeEnableAutoRefresh = (value: boolean) => {
    setEnableAutoRefresh(value)

    onEnableAutoRefresh?.(value, refreshRate)
  }

  return (
    <div className={cx(styles.container, containerClassName, { [styles.enable]: enableAutoRefresh })}>
      <EuiTextColor className={styles.summary}>
        {displayText && (
          <span data-testid="refresh-message-label">{`${enableAutoRefresh ? 'Auto refresh:' : 'Last refresh:'}`}</span>
        )}
        <span className={styles.time} data-testid="refresh-message">
          {` ${enableAutoRefresh ? refreshRateMessage : refreshMessage}`}
        </span>
      </EuiTextColor>

      <EuiToolTip
        title="Last Refresh"
        className={styles.tooltip}
        position="top"
        content={refreshMessage}
      >
        <EuiButtonIcon
          size={iconSize}
          iconType="refresh"
          disabled={loading || disabled}
          onClick={handleRefreshClick}
          onMouseEnter={updateLastRefresh}
          className={cx(styles.btn, { [styles.rolling]: enableAutoRefresh })}
          aria-labelledby={testid?.replaceAll?.('-', ' ') || 'Refresh button'}
          data-testid={testid || 'refresh-btn'}
        />
      </EuiToolTip>

      <EuiPopover
        ownFocus={false}
        anchorPosition="downRight"
        isOpen={isPopoverOpen}
        anchorClassName={styles.anchorWrapper}
        panelClassName={cx('popover-without-top-tail', styles.popoverWrapper)}
        closePopover={closePopover}
        button={(
          <EuiButtonIcon
            disabled={disabled}
            iconType="arrowDown"
            color="subdued"
            aria-label="Auto-refresh config popover"
            className={cx(styles.anchorBtn, { [styles.anchorBtnOpen]: isPopoverOpen })}
            onClick={onButtonClick}
            data-testid="auto-refresh-config-btn"
          />
        )}
      >
        <div className={styles.switch}>
          <EuiSwitch
            compressed
            label="Auto Refresh"
            checked={enableAutoRefresh}
            onChange={(e) => onChangeEnableAutoRefresh(e.target.checked)}
            className={styles.switchOption}
            data-testid="auto-refresh-switch"
          />
        </div>
        <div className={styles.inputContainer}>
          <div className={styles.inputLabel}>Refresh rate:</div>
          {!editingRate && (
            <EuiTextColor
              color="subdued"
              className={styles.refreshRateText}
              onClick={() => setEditingRate(true)}
              data-testid="refresh-rate"
            >
              {`${refreshRate} s`}
              <div className={styles.refreshRatePencil}><EuiIcon type="pencil" /></div>
            </EuiTextColor>
          )}
          {editingRate && (
            <>
              <div className={styles.input} data-testid="auto-refresh-rate-input">
                <InlineItemEditor
                  initialValue={refreshRate}
                  fieldName="refreshRate"
                  placeholder={DEFAULT_REFRESH_RATE}
                  isLoading={loading}
                  validation={validateRefreshRateNumber}
                  disableByValidation={errorValidateRefreshRateNumber}
                  onDecline={() => handleDeclineAutoRefreshRate()}
                  onApply={(value) => handleApplyAutoRefreshRate(value)}
                />
              </div>
              <EuiTextColor color="subdued">{' s'}</EuiTextColor>
            </>
          )}
        </div>

      </EuiPopover>

    </div>
  )
}

export default React.memo(AutoRefresh)
