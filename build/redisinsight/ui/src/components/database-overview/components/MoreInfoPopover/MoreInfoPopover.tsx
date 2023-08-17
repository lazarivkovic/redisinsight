import React, { useState } from 'react'
import { EuiButtonIcon, EuiFlexGroup, EuiFlexItem, EuiIcon, EuiLoadingSpinner, EuiPopover } from '@elastic/eui'
import cx from 'classnames'
import parse from 'html-react-parser'
import { DATABASE_LIST_MODULES_TEXT } from 'uiSrc/slices/interfaces'

import { getModule, truncateText } from 'uiSrc/utils'
import { AdditionalRedisModule } from 'apiSrc/modules/database/models/additional.redis.module'

import { IMetric } from '../OverviewMetrics'

import './styles.scss'
import styles from './styles.module.scss'

const ModulesInfoText = 'More information about Redis modules can be found <a class="link-underline" href="https://redis.io/resources/modules/" target="_blank" rel="noreferrer">here</a>.\nCreate a <a class="link-underline" href="https://redis.com/try-free/?utm_source=redis&utm_medium=app&utm_campaign=redisinsight" target="_blank" rel="noreferrer">free Redis database</a> with modules support on Redis Cloud.\n'

interface IProps {
  metrics: Array<IMetric>,
  modules: Array<AdditionalRedisModule>
}

const MoreInfoPopover = ({ metrics, modules }: IProps) => {
  const [isShowMoreInfoPopover, setIsShowMoreInfoPopover] = useState(false)

  return (
    <EuiPopover
      ownFocus={false}
      anchorPosition="downCenter"
      isOpen={isShowMoreInfoPopover}
      closePopover={() => setIsShowMoreInfoPopover(false)}
      anchorClassName={styles.moreInfo}
      panelClassName={cx('euiToolTip', 'popoverLikeTooltip', 'mi_wrapper')}
      button={(
        <EuiButtonIcon
          iconType="boxesVertical"
          onClick={() => setIsShowMoreInfoPopover((isOpenPopover) => !isOpenPopover)}
          aria-labelledby="more info"
          data-testid="overview-more-info-button"
        />
      )}
    >
      <div className="flex-row space-between" data-testid="overview-more-info-tooltip">
        {!!metrics.length && (
          <div className={styles.metricsContainer}>
            <h4 className={styles.mi_fieldName} data-testid="overview-db-stat-title">Database statistics</h4>
            {metrics.map((overviewItem) => (
              <EuiFlexGroup
                className={styles.moreInfoOverviewItem}
                key={overviewItem.id}
                data-test-subj={overviewItem.id}
                gutterSize="none"
                responsive={false}
                alignItems="center"
              >
                {overviewItem.loading && (
                  <>
                    <EuiLoadingSpinner style={{ marginRight: '8px' }} size="m" />
                    <span>... </span>
                    <EuiFlexItem className={styles.moreInfoOverviewTitle} grow={false}>
                      {overviewItem.tooltip.title}
                    </EuiFlexItem>
                  </>
                )}
                {!overviewItem.loading && (
                  <>
                    {overviewItem?.tooltip?.icon && (
                      <EuiFlexItem className={styles.moreInfoOverviewIcon} grow={false}>
                        <EuiIcon
                          size="m"
                          type={overviewItem.tooltip?.icon}
                          className={styles.icon}
                        />
                      </EuiFlexItem>
                    )}
                  </>
                )}
                {
                  overviewItem.value !== undefined
                    ? (
                      <>
                        <EuiFlexItem className={styles.moreInfoOverviewContent} grow={false}>
                          {overviewItem.tooltip.content}
                        </EuiFlexItem>
                        <EuiFlexItem className={styles.moreInfoOverviewTitle} grow={false}>
                          {overviewItem.tooltip.title}
                        </EuiFlexItem>
                      </>
                    )
                    : (
                      <EuiFlexItem grow={false}>
                        <i>{overviewItem.unavailableText}</i>
                      </EuiFlexItem>
                    )
                }
              </EuiFlexGroup>
            ))}
          </div>
        )}
        <div className={styles.modulesContainer}>
          <h4 className={styles.mi_fieldName}>Modules</h4>
          {
            modules?.map(({ name = '', semanticVersion = '', version = '' }) => (
              <div key={name} className={cx(styles.mi_moduleName)}>
                {`${truncateText(getModule(name)?.name || DATABASE_LIST_MODULES_TEXT[name] || name, 50)} `}
                {!!(semanticVersion || version) && (
                  <span className={styles.mi_version}>
                    v.
                    {' '}
                    {semanticVersion || version}
                  </span>
                )}
              </div>
            ))
          }
          <p style={{ marginTop: '12px' }} className={styles.mi_smallText}>{parse(ModulesInfoText)}</p>
        </div>
      </div>
    </EuiPopover>
  )
}

export default MoreInfoPopover
