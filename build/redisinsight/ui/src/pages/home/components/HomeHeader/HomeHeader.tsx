import React, { useContext, useEffect, useState } from 'react'
import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiSpacer,
  EuiText,
  EuiToolTip,
} from '@elastic/eui'
import { isEmpty } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'
import cx from 'classnames'
import { FeatureFlagComponent, ImportDatabasesDialog, OAuthSsoHandlerDialog } from 'uiSrc/components'
import { sendEventTelemetry, TelemetryEvent } from 'uiSrc/telemetry'
import HelpLinksMenu from 'uiSrc/pages/home/components/HelpLinksMenu'
import PromoLink from 'uiSrc/components/promo-link/PromoLink'
import { ThemeContext } from 'uiSrc/contexts/themeContext'
import { contentSelector } from 'uiSrc/slices/content/create-redis-buttons'
import { HELP_LINKS, IHelpGuide } from 'uiSrc/pages/home/constants/help-links'
import { getPathToResource } from 'uiSrc/services/resourcesService'
import { ContentCreateRedis } from 'uiSrc/slices/interfaces/content'
import { instancesSelector } from 'uiSrc/slices/instances/instances'
import { OAuthSocialSource } from 'uiSrc/slices/interfaces'
import { FeatureFlags } from 'uiSrc/constants'
import { ReactComponent as ConfettiIcon } from 'uiSrc/assets/img/oauth/confetti.svg'
import { getContentByFeature } from 'uiSrc/utils/content'
import HighlightedFeature from 'uiSrc/components/hightlighted-feature/HighlightedFeature'
import { appFeatureFlagsFeaturesSelector, appFeatureHighlightingSelector, removeFeatureFromHighlighting } from 'uiSrc/slices/app/features'
import { getHighlightingFeatures } from 'uiSrc/utils/highlighting'
import { BUILD_FEATURES } from 'uiSrc/constants/featuresHighlighting'
import SearchDatabasesList from '../SearchDatabasesList'

import styles from './styles.module.scss'

export interface Props {
  onAddInstance: () => void
  direction: 'column' | 'row'
}

const CREATE_DATABASE = 'CREATE DATABASE'
const THE_GUIDES = 'THE GUIDES'

const HomeHeader = ({ onAddInstance, direction }: Props) => {
  const { theme } = useContext(ThemeContext)
  const { data: instances } = useSelector(instancesSelector)
  const featureFlags = useSelector(appFeatureFlagsFeaturesSelector)
  const { loading, data } = useSelector(contentSelector)
  const { features } = useSelector(appFeatureHighlightingSelector)
  const { cloudButton: cloudButtonHighlighting } = getHighlightingFeatures(features)

  const [promoData, setPromoData] = useState<ContentCreateRedis>()
  const [guides, setGuides] = useState<IHelpGuide[]>([])
  const [isImportDialogOpen, setIsImportDialogOpen] = useState<boolean>(false)

  const dispatch = useDispatch()

  useEffect(() => {
    if (loading || !data || isEmpty(data)) {
      return
    }

    if (data?.cloud && !isEmpty(data.cloud)) {
      setPromoData(getContentByFeature(data.cloud, featureFlags))
    }

    const items = Object.entries(data)
      .map(([key, item]) => {
        const { title, links, description } = getContentByFeature(item, featureFlags)
        return ({
          id: key,
          title,
          description,
          event: HELP_LINKS[key as keyof typeof HELP_LINKS]?.event,
          url: links?.main?.url,
          primary: key.toLowerCase() === 'cloud',
        })
      })

    setGuides(items)
  }, [loading, data, featureFlags])

  const handleOnAddDatabase = () => {
    sendEventTelemetry({
      event: TelemetryEvent.CONFIG_DATABASES_CLICKED,
    })
    onAddInstance()
  }

  const handleClickLink = (event: TelemetryEvent, eventData: any = {}) => {
    if (event) {
      sendEventTelemetry({
        event,
        eventData: {
          ...eventData
        }
      })
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

  const handleCreateDatabaseClick = (
    event: TelemetryEvent,
    eventData: any = {},
  ) => {
    handleClickLink(event, eventData)
  }

  const AddInstanceBtn = () => (
    <>
      <EuiButton
        fill
        color="secondary"
        onClick={handleOnAddDatabase}
        className={styles.addInstanceBtn}
        data-testid="add-redis-database-short"
      >
        <span className={cx('eui-showFor--s', 'eui-showFor--xs')}>+ ADD DATABASE</span>
        <span className={cx('eui-hideFor--s', 'eui-hideFor--xs')}>+ ADD REDIS DATABASE</span>
      </EuiButton>
    </>
  )

  const ImportDatabasesBtn = () => (
    <EuiToolTip
      content="Import Database Connections"
    >
      <EuiButton
        fill
        color="secondary"
        onClick={handleClickImportDbBtn}
        className={styles.importDatabasesBtn}
        size="m"
        data-testid="import-from-file-btn"
      >
        <EuiIcon type="importAction" />
      </EuiButton>
    </EuiToolTip>
  )

  const Guides = () => (
    <div className={styles.links}>
      <EuiFlexGroup>
        <EuiFlexItem grow={false} className={styles.clearMarginFlexItem}>
          <EuiText className={styles.followText}>
            {promoData ? 'Or follow the guides:' : 'Follow the guides:'}
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup className={styles.otherGuides}>
        {guides
          .filter(({ id }) => id?.toLowerCase() !== 'cloud')
          .map(({ id, url, title, event }) => (
            <EuiFlexItem key={id} grow={direction === 'column'}>
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
  )

  const CreateBtn = ({ content }: { content: ContentCreateRedis }) => {
    const { title, description, styles: stylesCss, links } = content
    // @ts-ignore
    const linkStyles = stylesCss ? stylesCss[theme] : {}
    const promoLink = (
      <OAuthSsoHandlerDialog>
        {(ssoCloudHandlerClick) => (
          <PromoLink
            title={title}
            description={description}
            url={links?.main?.url}
            testId="promo-btn"
            icon="arrowRight"
            styles={{
              ...linkStyles,
              backgroundImage: linkStyles?.backgroundImage
                ? `url(${getPathToResource(linkStyles.backgroundImage)})`
                : undefined
            }}
            onClick={(e) => {
              handleCreateDatabaseClick(HELP_LINKS.cloud.event, { source: 'My Redis databases' })
              ssoCloudHandlerClick(e, OAuthSocialSource.ListOfDatabases)
            }}
          />
        )}
      </OAuthSsoHandlerDialog>
    )
    return (
      <FeatureFlagComponent name={FeatureFlags.cloudSso} otherwise={promoLink}>
        <HighlightedFeature
          isHighlight={cloudButtonHighlighting}
          type={BUILD_FEATURES?.cloudButton?.type}
          onClick={() => dispatch(removeFeatureFromHighlighting('cloudButton'))}
        >
          <EuiToolTip
            position="bottom"
            anchorClassName={styles.cloudSsoPromoBtnAnchor}
            content={(
              <div className={styles.cloudSsoPromoTooltip}>
                <EuiIcon type={ConfettiIcon} className={styles.cloudSsoPromoTooltipIcon} />
                <div>
                  New!
                  <br />
                  Now you can create a free Redis Stack database in Redis Enterprise Cloud in a few clicks.
                </div>
              </div>
          )}
          >
            {promoLink}
          </EuiToolTip>
        </HighlightedFeature>
      </FeatureFlagComponent>
    )
  }

  return (
    <>
      {isImportDialogOpen && <ImportDatabasesDialog onClose={handleCloseImportDb} />}
      <div className={styles.containerDl}>
        <EuiFlexGroup className={styles.contentDL} alignItems="center" responsive={false}>
          <EuiFlexItem grow={false}>
            <AddInstanceBtn />
          </EuiFlexItem>
          <EuiFlexItem grow={false} style={{ marginLeft: 0, marginRight: 0 }}>
            <ImportDatabasesBtn />
          </EuiFlexItem>
          <EuiFlexItem className={cx(styles.separatorContainer)} grow={false}>
            <div className={styles.separator} />
          </EuiFlexItem>
          {!loading && !isEmpty(data) && (
            <>
              <EuiFlexItem grow className={cx(styles.promo)}>
                <EuiFlexGroup alignItems="center">
                  {promoData && (
                    <EuiFlexItem grow={false}>
                      <CreateBtn content={promoData} />
                    </EuiFlexItem>
                  )}
                  <EuiFlexItem className={styles.linkGuides}>
                    <Guides />
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
              <EuiFlexItem grow={false} className={styles.fullGuides}>
                <HelpLinksMenu
                  items={guides}
                  buttonText={CREATE_DATABASE}
                  onLinkClick={(link) => handleClickLink(HELP_LINKS[link as keyof typeof HELP_LINKS]?.event)}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false} className={styles.smallGuides}>
                <HelpLinksMenu
                  emptyAnchor
                  items={guides.slice(1)}
                  buttonText={THE_GUIDES}
                  onLinkClick={(link) => handleClickLink(HELP_LINKS[link as keyof typeof HELP_LINKS]?.event)}
                />
              </EuiFlexItem>
            </>
          )}
          {instances.length > 0 && (
            <EuiFlexItem className={styles.searchContainer}>
              <SearchDatabasesList />
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
        <EuiSpacer className={styles.spacerDl} />
      </div>
    </>
  )
}

export default HomeHeader
