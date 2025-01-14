/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Author:     Chris Brame
 *  Updated:    1/20/19 4:46 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import SidebarItem from 'components/Nav/SidebarItem'
import NavSeparator from 'components/Nav/NavSeperator'
import Submenu from 'components/Nav/Submenu'
import SubmenuItem from 'components/Nav/SubmenuItem'
import { withTranslation } from 'react-i18next';

import { updateNavChange } from '../../../actions/nav'

import Helpers from 'lib/helpers'

class Sidebar extends React.Component {
  constructor(props) {
    super(props)
  }

  componentDidMount() {
    // Helpers.UI.getPlugins((err, result) => {
    //   if (!err && result.plugins) {
    //     this.setState({ plugins: result.plugins })
    //   }
    // })
  }

  componentDidUpdate() {
    Helpers.UI.initSidebar()
    Helpers.UI.bindExpand()
  }

  renderPlugins() {
    const { plugins, sessionUser, activeItem, activeSubItem } = this.state
    return (
      <SidebarItem
        text='Plugins'
        icon='extension'
        href='/plugins'
        class='navPlugins tether-plugins'
        hasSubmenu={plugins && plugins.length > 0}
        subMenuTarget='plugins'
        active={activeItem === 'plugins'}
      >
        {plugins && plugins.length > 0 && (
          <Submenu id='plugins' subMenuOpen={activeItem === 'plugins'}>
            {plugins.map(function (item) {
              const perms = item.permissions.split(' ')
              if (perms.indexOf(sessionUser.role) === -1) return
              return (
                <SubmenuItem
                  key={item.name}
                  text={item.menu.main.name}
                  icon={item.menu.main.icon}
                  href={item.menu.main.link}
                  active={activeSubItem === item.name}
                />
              )
            })}
          </Submenu>
        )}
      </SidebarItem>
    )
  }

  render() {
    const { activeItem, activeSubItem, sessionUser, common, t } = this.props
    return (
      <ul className='side-nav'>
        {sessionUser && Helpers.canUser('agent:*', true) && (
          <SidebarItem
            text={t('Dashboard')}
            icon='dashboard'
            href={`/${common.organizationSlug}/dashboard`}
            class='navHome'
            active={activeItem === 'dashboard'}
          />
        )}
        {sessionUser && Helpers.canUser('tickets:view') && (
          <SidebarItem
            text={t('Tickets')}
            icon='assignment'
            href={`/${common.organizationSlug}/tickets`}
            class='navTickets no-ajaxy'
            hasSubmenu={true}
            subMenuTarget='tickets'
            active={activeItem === 'tickets'}
          >
            <Submenu id='tickets'>
              <SubmenuItem
                text={t('Active')}
                icon='timer'
                href={`/${common.organizationSlug}/tickets/active`}
                active={activeSubItem === 'tickets-active'}
              />
              <SubmenuItem
                text={t('Assigned')}
                icon='assignment_ind'
                href={`/${common.organizationSlug}/tickets/assigned`}
                active={activeSubItem === 'tickets-assigned'}
              />
              <SubmenuItem
                text={t('Unassigned')}
                icon='person_add_disabled'
                href={`/${common.organizationSlug}/tickets/unassigned`}
                active={activeSubItem === 'tickets-unassigned'}
              />
              <NavSeparator />
              <SubmenuItem text={t('New')} icon='&#xE24D;' href={`/${common.organizationSlug}/tickets/new`} active={activeSubItem === 'tickets-new'} />
              <SubmenuItem
                text={t('Pending')}
                icon='&#xE629;'
                href={`/${common.organizationSlug}/tickets/pending`}
                active={activeSubItem === 'tickets-pending'}
              />
              <SubmenuItem text={t('Open')} icon='&#xE2C8;' href={`/${common.organizationSlug}/tickets/open`} active={activeSubItem === 'tickets-open'} />
              <SubmenuItem
                text={t('Closed')}
                icon='&#xE2C7;'
                href={`/${common.organizationSlug}/tickets/closed`}
                active={activeSubItem === 'tickets-closed'}
              />
            </Submenu>
          </SidebarItem>
        )}
        {/* <SidebarItem
          text={t('Messages')}
          icon='chat'
          href={`/${common.organizationSlug}/messages`}
          class='navMessages'
          active={activeItem === 'messages'}
        /> */}
        {sessionUser && Helpers.canUser('accounts:view') && (
          <SidebarItem
            text={t('Accounts')}
            icon='&#xE7FD;'
            href={`/${common.organizationSlug}/accounts`}
            class='navAccounts'
            active={activeItem === 'accounts'}
            subMenuTarget='accounts'
            hasSubmenu={sessionUser && Helpers.canUser('agent:*', true)}
          >
            {sessionUser && Helpers.canUser('agent:*', true) && (
              <Submenu id='accounts'>
                <SubmenuItem
                  href={`/${common.organizationSlug}/accounts/customer`}
                  text={t('Customers')}
                  icon={'account_box'}
                  active={activeSubItem === 'accounts-customers'}
                />
                {sessionUser && Helpers.canUser('agent:*', true) && (
                  <SubmenuItem
                    href={`/${common.organizationSlug}/accounts/agents`}
                    text={t('Agents')}
                    icon={'account_circle'}
                    active={activeSubItem === 'accounts-agents'}
                  />
                )}
                {sessionUser && Helpers.canUser('admin:*') && (
                  <SubmenuItem
                    href={`/${common.organizationSlug}/accounts/admin`}
                    text={t('Admins')}
                    icon={'how_to_reg'}
                    active={activeSubItem === 'accounts-admins'}
                  />
                )}
              </Submenu>
            )}
          </SidebarItem>
        )}
        {sessionUser && Helpers.canUser('groups:view') && (
          <SidebarItem
            text={t('Customer Groups')}
            icon='supervisor_account'
            href={`/${common.organizationSlug}/groups`}
            class='navGroups'
            active={activeItem === 'groups'}
          />
        )}
        {sessionUser && Helpers.canUser('teams:view') && (
          <SidebarItem text={t('Teams')} icon='wc' href={`/${common.organizationSlug}/teams`} class='navTeams' active={activeItem === 'teams'} />
        )}
        {sessionUser && Helpers.canUser('departments:view') && (
          <SidebarItem
            text={t('Departments')}
            icon='domain'
            href={`/${common.organizationSlug}/departments`}
            class='navTeams'
            active={activeItem === 'departments'}
          />
        )}
        {sessionUser && Helpers.canUser('reports:view') && (
          <SidebarItem
            text={t('Reports')}
            icon='assessment'
            href={`/${common.organizationSlug}/reports/generate`}
            class='navReports no-ajaxy'
            hasSubmenu={true}
            subMenuTarget='reports'
            active={activeItem === 'reports'}
          >
            <Submenu id='reports'>
              <SubmenuItem
                text={t('Generate')}
                icon='timeline'
                href={`/${common.organizationSlug}/reports/generate`}
                active={activeSubItem === 'reports-generate'}
              />
              <NavSeparator />
              <SubmenuItem
                text={t('Group Breakdown')}
                icon='supervisor_account'
                href={`/${common.organizationSlug}/reports/breakdown/group`}
                active={activeSubItem === 'reports-breakdown-group'}
              />
              <SubmenuItem
                text={t('User Breakdown')}
                icon='perm_identity'
                href={`/${common.organizationSlug}/reports/breakdown/user`}
                active={activeSubItem === 'reports-breakdown-user'}
              />
            </Submenu>
          </SidebarItem>
        )}

        {/*{this.renderPlugins()}*/}

        {sessionUser && Helpers.canUser('notices:view') && (
          <SidebarItem
            text={t('Notices')}
            icon='warning'
            href={`/${common.organizationSlug}/notices`}
            class='navNotices'
            active={activeItem === 'notices'}
          />
        )}

        {sessionUser && Helpers.canUser('settings:edit') && (
          <SidebarItem
            text={t('Settings')}
            icon='settings'
            href={`/${common.organizationSlug}/settings/general`}
            class='navSettings no-ajaxy'
            hasSubmenu={true}
            subMenuTarget='settings'
            active={activeItem === 'settings'}
          >
            <Submenu id='settings'>
              <SubmenuItem text={t('General')} icon='tune' href={`/${common.organizationSlug}/settings/`} active={activeSubItem === 'settings-general'} />
              <SubmenuItem
                text={t('Appearance')}
                icon='style'
                href={`/${common.organizationSlug}/settings/appearance`}
                active={activeSubItem === 'settings-appearance'}
              />
              <SubmenuItem
                text={t('Tickets')}
                icon='assignment'
                href={`/${common.organizationSlug}/settings/tickets`}
                active={activeSubItem === 'settings-tickets'}
              />
              <SubmenuItem
                text={t('Permissions')}
                icon='security'
                href={`/${common.organizationSlug}/settings/permissions`}
                active={activeSubItem === 'settings-permissions'}
              />
              <SubmenuItem
                text={t('Mailer')}
                icon='email'
                href={`/${common.organizationSlug}/settings/mailer`}
                active={activeSubItem === 'settings-mailer'}
              />
              {/*<SubmenuItem text="Notifications" icon="" href="/settings/notifications" active={activeSubItem === 'settings-notifications'} />*/}
              {/* <SubmenuItem
                href={`/${common.organizationSlug}/settings/elasticsearch`}
                text={t('Elasticsearch')}
                icon={'search'}
                active={activeSubItem === 'settings-elasticsearch'}
              />
              <SubmenuItem
                text={t('Push Service')}
                icon='mobile_friendly'
                href={`/${common.organizationSlug}/settings/tps`}
                active={activeSubItem === 'settings-tps'}
              />
              <SubmenuItem
                text={t('Backup/Restore')}
                icon='archive'
                href={`/${common.organizationSlug}/settings/backup`}
                active={activeSubItem === 'settings-backup'}
              />
              <SubmenuItem
                text={t('Legal')}
                icon='gavel'
                href={`/${common.organizationSlug}/settings/legal`}
                active={activeSubItem === 'settings-legal'}
              /> */}
              {sessionUser && Helpers.canUser('settings:logs') && (
                <SubmenuItem
                  text={t('Logs')}
                  icon='remove_from_queue'
                  href={`/${common.organizationSlug}/settings/logs`}
                  hasSeperator={true}
                  active={activeSubItem === 'settings-logs'}
                />
              )}
            </Submenu>
          </SidebarItem>
        )}
        <NavSeparator />
        {/* <SidebarItem href='/about' icon='help' text={t('About')} active={activeItem === 'about'} />
        <SidebarItem href={'https://www.trudesk.io'} icon={'cloud'} text={t('Cloud')} target={'_blank'} /> */}
      </ul>
    )
  }
}

Sidebar.propTypes = {
  updateNavChange: PropTypes.func.isRequired,
  activeItem: PropTypes.string.isRequired,
  activeSubItem: PropTypes.string.isRequired,
  sessionUser: PropTypes.object,
  plugins: PropTypes.array,
  common: PropTypes.object
}

const mapStateToProps = state => ({
  activeItem: state.sidebar.activeItem,
  activeSubItem: state.sidebar.activeSubItem,
  sessionUser: state.shared.sessionUser,
  common: state.common,
})

export default withTranslation('common')(connect(
  mapStateToProps,
  { updateNavChange }
)(Sidebar))
