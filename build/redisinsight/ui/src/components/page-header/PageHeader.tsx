/* eslint-disable react/jsx-props-no-spreading */
import React, { useContext } from 'react'
import { EuiButtonEmpty, EuiTitle } from '@elastic/eui'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'

import { Theme, Pages } from 'uiSrc/constants'
import { resetDataRedisCloud } from 'uiSrc/slices/instances/cloud'
import { ThemeContext } from 'uiSrc/contexts/themeContext'
import { resetDataRedisCluster } from 'uiSrc/slices/instances/cluster'
import { resetDataSentinel } from 'uiSrc/slices/instances/sentinel'

import darkLogo from 'uiSrc/assets/img/dark_logo.svg'
import lightLogo from 'uiSrc/assets/img/light_logo.svg'

import styles from './PageHeader.module.scss'

interface Props {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

const PageHeader = ({ title, subtitle, children }: Props) => {
  const history = useHistory()
  const dispatch = useDispatch()
  const { theme } = useContext(ThemeContext)

  const resetConnections = () => {
    dispatch(resetDataRedisCluster())
    dispatch(resetDataRedisCloud())
    dispatch(resetDataSentinel())
  }

  const goHome = () => {
    resetConnections()
    history.push(Pages.home)
  }

  return (
    <div className={styles.pageHeader}>
      <div className={styles.pageHeaderTop}>
        <div>
          <EuiTitle size="s" className={styles.title}>
            <h1>
              <b>{title}</b>
            </h1>
          </EuiTitle>
          {subtitle ? <span>{subtitle}</span> : ''}
        </div>
        <div className={styles.pageHeaderLogo}>
          <EuiButtonEmpty
            aria-label="redisinsight"
            onClick={goHome}
            onKeyDown={goHome}
            className={styles.logo}
            tabIndex={0}
            iconType={theme === Theme.Dark ? darkLogo : lightLogo}
          />
        </div>
      </div>
      {children ? <div>{children}</div> : ''}
    </div>
  )
}

PageHeader.defaultProps = {
  subtitle: null,
  children: null,
}

export default PageHeader
