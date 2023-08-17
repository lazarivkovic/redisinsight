import React, { useState } from 'react'
import {
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiIcon,
  EuiInputPopover,
  EuiLink,
  EuiText,
} from '@elastic/eui'
import cx from 'classnames'

import { IHelpGuide } from 'uiSrc/pages/home/constants/help-links'

import styles from './styles.module.scss'

export interface Props {
  onLinkClick?: (link: string) => void
  items: IHelpGuide[]
  buttonText: string
  emptyAnchor?: boolean
}

const HelpLinksMenu = ({ emptyAnchor, onLinkClick, items, buttonText }: Props) => {
  const [isPopoverOpen, setPopover] = useState(false)

  const onButtonClick = () => {
    setPopover(!isPopoverOpen)
  }

  const closePopover = () => {
    setPopover(false)
  }

  const handleLinkClick = (link: string) => {
    closePopover()
    if (onLinkClick) {
      onLinkClick(link)
    }
  }

  const menuItems = items?.map(({ id, url, title, primary }) => (
    <EuiContextMenuItem className={cx(styles.item, { [styles.itemEmpty]: emptyAnchor })} key={id}>
      <EuiLink
        external={false}
        href={url}
        target="_blank"
        onClick={() => handleLinkClick(id)}
      >
        <EuiText style={{ fontWeight: primary ? 500 : 400 }}>
          {title}
        </EuiText>
      </EuiLink>
    </EuiContextMenuItem>
  ))

  const button = (
    <button
      type="button"
      onClick={onButtonClick}
      className={cx(
        styles.button,
        {
          [styles.buttonEmpty]: emptyAnchor,
          [styles.buttonOpen]: isPopoverOpen,
        }
      )}
    >
      <EuiText size="m">{buttonText}</EuiText>
      <EuiIcon type="arrowDown" className={styles.arrowIcon} />
    </button>
  )

  return (
    <EuiInputPopover
      display="block"
      id="databasesMenu"
      input={button}
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      panelPaddingSize="none"
      anchorClassName={cx(styles.anchor, { [styles.anchorEmpty]: emptyAnchor })}
      panelClassName={cx(styles.popover, { [styles.popoverEmpty]: emptyAnchor })}
    >
      <EuiContextMenuPanel size="s" items={menuItems} />
    </EuiInputPopover>
  )
}

export default HelpLinksMenu
