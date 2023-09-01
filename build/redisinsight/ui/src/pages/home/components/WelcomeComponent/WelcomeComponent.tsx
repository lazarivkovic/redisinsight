import { EuiIcon, EuiFlexGroup, EuiFlexItem, EuiText, EuiTitle, EuiSpacer, EuiFlexGrid } from '@elastic/eui'
import React, { useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import cx from 'classnames'

import { isEmpty } from 'lodash'
import { FeatureFlags, Theme } from 'uiSrc/constants'
import { setTitle } from 'uiSrc/utils'
import { ThemeContext } from 'uiSrc/contexts/themeContext'
import { sendEventTelemetry, sendPageViewTelemetry, TelemetryEvent, TelemetryPageView } from 'uiSrc/telemetry'
import { appAnalyticsInfoSelector } from 'uiSrc/slices/app/info'
import darkLogo from 'uiSrc/assets/img/dark_logo.svg'
import lightLogo from 'uiSrc/assets/img/light_logo.svg'
import { AddDbType } from 'uiSrc/pages/home/components/AddDatabases/AddDatabasesContainer'
import { ReactComponent as CloudStars } from 'uiSrc/assets/img/oauth/stars.svg'
import { ReactComponent as CloudIcon } from 'uiSrc/assets/img/oauth/cloud.svg'

import { appFeatureFlagsFeaturesSelector } from 'uiSrc/slices/app/features'
import { contentSelector } from 'uiSrc/slices/content/create-redis-buttons'
import { getContentByFeature } from 'uiSrc/utils/content'
import { HELP_LINKS, IHelpGuide } from 'uiSrc/pages/home/constants/help-links'
import { ContentCreateRedis } from 'uiSrc/slices/interfaces/content'
import {
  FeatureFlagComponent,
  ImportDatabasesDialog,
  OAuthSocialHandlerDialog,
  OAuthSsoHandlerDialog
} from 'uiSrc/components'
import { OAuthSocialSource } from 'uiSrc/slices/interfaces'
import { getPathToResource } from 'uiSrc/services/resourcesService'

import styles from './styles.module.scss'

export interface Props {
  onAddInstance: (addDbType?: AddDbType) => void
}

const Welcome = ({ onAddInstance }: Props) => {
  const featureFlags = useSelector(appFeatureFlagsFeaturesSelector)
  const { loading, data } = useSelector(contentSelector)
  const { identified: analyticsIdentified } = useSelector(appAnalyticsInfoSelector)

  const [promoData, setPromoData] = useState<ContentCreateRedis>()
  const [guides, setGuides] = useState<IHelpGuide[]>([])
  const [isImportDialogOpen, setIsImportDialogOpen] = useState<boolean>(false)

  const { theme } = useContext(ThemeContext)

  setTitle('Welcome to RedisInsight')

  const CONNECT_BUTTONS = [
    {
      title: 'Connect Your Databases',
      buttons: [
        {
          title: 'Add connection details manually',
          description: (<>Enter host and port to connect to your Redis database</>),
          iconType: 'plus',
          onClick: () => onAddInstance(AddDbType.manual),
          testId: 'add-db-manually-btn'
        },
        {
          title: 'Auto-discover your Redis databases',
          description: 'Use discovery tools to add Redis Sentinel or Redis Enterprise databases',
          iconType: 'search',
          onClick: () => onAddInstance(AddDbType.auto),
          testId: 'add-db-auto-btn'
        },
      ]
    },
    {
      title: 'Import database connections',
      buttons: [
        {
          title: 'Import Redis Cloud database connections',
          description: 'Sign in to your Redis Enterprise Cloud account to discover and add databases',
          iconType: CloudIcon,
          iconClassName: styles.cloudIcon,
          feature: FeatureFlags.cloudSso,
          testId: 'import-cloud-db-btn'
        },
        {
          title: 'Import database connections from a file',
          description: (<>Migrate your database connections to <br />RedisInsight</>),
          iconType: 'download',
          onClick: () => handleClickImportDbBtn(),
          testId: 'import-from-file-btn'
        },
      ]
    }
  ]

  useEffect(() => {
    if (analyticsIdentified) {
      sendPageViewTelemetry({
        name: TelemetryPageView.WELCOME_PAGE
      })
    }
  }, [analyticsIdentified])

  useEffect(() => {
    if (loading || !data || isEmpty(data)) {
      return
    }

    if (data?.cloud && !isEmpty(data.cloud)) {
      setPromoData(getContentByFeature(data.cloud, featureFlags))
    }

    const items = Object.entries(data)
      .filter(([key]) => key.toLowerCase() !== 'cloud')
      .map(([key, item]) => {
        const { title, links, description } = getContentByFeature(item, featureFlags)
        return ({
          id: key,
          title,
          description,
          event: HELP_LINKS[key as keyof typeof HELP_LINKS]?.event,
          url: links?.main?.url,
        })
      })

    setGuides(items)
  }, [loading, data, featureFlags])

  const handleClickLink = (event: TelemetryEvent, eventData: any = {}) => {
    if (event) {
      sendEventTelemetry({ event, eventData })
    }
  }

  const handleClickImportDbBtn = () => {
    setIsImportDialogOpen(true)
    sendEventTelemetry({
      event: TelemetryEvent.CONFIG_DATABASES_REDIS_IMPORT_CLICKED,
    })
  }

  const handleCloseImportDb = (isCancelled: boolean) => {
    setIsImportDialogOpen(false)
    isCancelled && sendEventTelemetry({
      event: TelemetryEvent.CONFIG_DATABASES_REDIS_IMPORT_CANCELLED,
    })
  }

  const PromoButton = ({ content }: { content: ContentCreateRedis }) => {
    const { title, description, links, styles: stylesCss } = content
    // @ts-ignore
    const linkStyles = stylesCss ? stylesCss[theme] : {}

    return (
      <OAuthSsoHandlerDialog>
        {(ssoCloudHandlerClick) => (
          <a
            role="button"
            tabIndex={0}
            href={links?.main?.url || '#'}
            className={cx(styles.btn, styles.promoButton)}
            onClick={(e) => {
              handleClickLink(HELP_LINKS.cloud.event, { source: OAuthSocialSource.WelcomeScreen })
              ssoCloudHandlerClick(e, OAuthSocialSource.WelcomeScreen)
            }}
            target="_blank"
            style={{
              ...linkStyles,
              backgroundImage: linkStyles?.backgroundImage
                ? `url(${getPathToResource(linkStyles.backgroundImage)})`
                : undefined
            }}
            data-testid="promo-btn"
            rel="noreferrer"
          >
            <EuiIcon className={styles.btnIcon} type={CloudStars} />
            <div className={styles.btnContent}>
              <div className={styles.btnTitle}>{title}</div>
              <div className={styles.btnText}>{description}</div>
            </div>
            <EuiIcon className={styles.arrowIcon} type="arrowRight" />
          </a>
        )}
      </OAuthSsoHandlerDialog>
    )
  }

  const renderButton = (
    { title, description, onClick, iconType, iconClassName, testId }: any,
    optionalOnClick?: (e: React.MouseEvent) => void
  ) => (
    <EuiFlexItem key={testId}>
      <div
        key={`btn-${testId}`}
        role="button"
        tabIndex={0}
        className={styles.btn}
        onKeyDown={() => {}}
        onClick={(e) => {
          optionalOnClick?.(e)
          onClick?.()
        }}
        data-testid={testId}
      >
        <EuiIcon className={cx(styles.btnIcon, iconClassName)} type={iconType} />
        <div>
          <div className={styles.btnTitle}>{title}</div>
          <div className={styles.btnText}>{description}</div>
        </div>
        <EuiIcon className={styles.arrowIcon} type="arrowRight" />
      </div>
    </EuiFlexItem>
  )

  return (
    <>
      {isImportDialogOpen && <ImportDatabasesDialog onClose={handleCloseImportDb} />}
      <div className={cx(styles.welcome, theme === Theme.Dark ? styles.welcome_dark : styles.welcome_light)}>
        <div className={styles.content}>
          <EuiTitle size="m" className={styles.title} data-testid="welcome-page-title">
            <h4>Welcome to</h4>
          </EuiTitle>
          <img
            alt="logo"
            className={styles.logo}
            src={theme === Theme.Dark ? darkLogo : lightLogo}
          />
          <EuiText className={styles.text}>
            Thanks for choosing RedisInsight to visualize and optimize Redis data.
          </EuiText>
          <EuiTitle size="s" className={styles.subTitle}>
            <h4>Add database connections</h4>
          </EuiTitle>
          <EuiText className={styles.text}>
            To get started, add your existing Redis database connections or create a free Redis Cloud database.
          </EuiText>

          <div className={styles.controls}>
            <div className={styles.controlsGroup}>
              <EuiTitle className={styles.controlsGroupTitle} size="s">
                <h5>Redis Cloud Database</h5>
              </EuiTitle>
              {promoData && (<PromoButton content={promoData} />)}
            </div>

            {CONNECT_BUTTONS.map(({ title, buttons }) => (
              <div className={styles.controlsGroup} key={`container-${title}`}>
                <EuiTitle className={styles.controlsGroupTitle} size="s">
                  <h5>{title}</h5>
                </EuiTitle>
                <EuiFlexGrid columns={2}>
                  {buttons.map((button: any) => {
                    if (button?.feature === FeatureFlags.cloudSso) {
                      return (
                        <FeatureFlagComponent key="cloudSsoComponent" name={FeatureFlags.cloudSso}>
                          <OAuthSocialHandlerDialog>
                            {(socialCloudHandlerClick) => (
                              <>
                                {renderButton(button, (e: React.MouseEvent) => {
                                  socialCloudHandlerClick(e, OAuthSocialSource.WelcomeScreen)
                                })}
                              </>
                            )}
                          </OAuthSocialHandlerDialog>
                        </FeatureFlagComponent>
                      )
                    }

                    return renderButton(button)
                  })}
                </EuiFlexGrid>
              </div>
            ))}
          </div>

          {!!guides.length && (
            <div className={styles.links} data-testid="guide-links">
              Follow the guides
              <EuiSpacer size="m" />
              <EuiFlexGroup key="guides" className={styles.otherGuides}>
                {guides
                  .map(({ id, url, title, event }) => (
                    <EuiFlexItem key={id} grow={false}>
                      <a
                        href={url}
                        onClick={() => handleClickLink(event as TelemetryEvent)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {title}
                      </a>
                    </EuiFlexItem>
                  ))}
              </EuiFlexGroup>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Welcome
