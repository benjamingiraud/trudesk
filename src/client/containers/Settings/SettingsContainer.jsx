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
 *  Updated:    2/6/19 6:21 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { fetchSettings } from 'actions/settings'

import Menu from 'components/Settings/Menu'
import MenuItem from 'components/Settings/MenuItem'
import GeneralSettings from './General'
import AppearanceSettings from './Appearance'
import PermissionsSettingsContainer from './Permissions'
import TicketsSettings from './Tickets'
import MailerSettingsContainer from './Mailer'
import ElasticsearchSettingsContainer from './Elasticsearch'
import TPSSettingsContainer from './TPS'
import BackupRestoreSettingsContainer from './BackupRestore'
import LegalSettingsContainer from 'containers/Settings/Legal'
import { withTranslation } from 'react-i18next';

import helpers from 'lib/helpers'

class SettingsContainer extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      title: 'Settings',
      activeCategory: 'settings-general'
    }
  }

  componentDidMount () {
    console.log(this.props)
    const location = window.location.pathname.replace(/^(\/settings(\/?))/, '')
    if (location) {
      this.setState({
        activeCategory: 'settings-' + location
      })
    }

    this.props.fetchSettings()

    helpers.resizeAll()
  }

  onMenuItemClick (e, category) {
    if (this.state.activeCategory === 'settings-' + category) return

    this.setState(
      {
        activeCategory: 'settings-' + category
      },
      () => {
        if (this.page) this.page.scrollTop = 0
      }
    )
  }

  render () {
    const { t } = this.props
    return (
      <div className='uk-grid uk-grid-collapse'>
        <div className='uk-width-1-6 uk-width-xLarge-1-10 message-list full-height' data-offset='68'>
          <div
            className='page-title noshadow nopadding-right'
            style={{ borderTop: 'none', borderBottom: 'none', height: '68px', paddingLeft: '20px' }}
          >
            <div style={{ position: 'relative' }}>
              <p style={{ fontSize: '24px' }}>{t(this.state.title)}</p>
            </div>
          </div>
          <div className='page-content-left noborder full-height'>
            <Menu>
              <MenuItem
                title={t('General')}
                active={this.state.activeCategory === 'settings-general'}
                onClick={e => {
                  this.onMenuItemClick(e, 'general')
                }}
              />
              <MenuItem
                title={t('Appearance')}
                active={this.state.activeCategory === 'settings-appearance'}
                onClick={e => {
                  this.onMenuItemClick(e, 'appearance')
                }}
              />
              <MenuItem
                title={t('Permissions')}
                active={this.state.activeCategory === 'settings-permissions'}
                onClick={e => {
                  this.onMenuItemClick(e, 'permissions')
                }}
              />
              <MenuItem
                title={t('Tickets')}
                active={this.state.activeCategory === 'settings-tickets'}
                onClick={e => {
                  this.onMenuItemClick(e, 'tickets')
                }}
              />
              <MenuItem
                title={t('Mailer')}
                active={this.state.activeCategory === 'settings-mailer'}
                onClick={e => {
                  this.onMenuItemClick(e, 'mailer')
                }}
              />
              {/* <MenuItem
                title={'Elasticsearch'}
                active={this.state.activeCategory === 'settings-elasticsearch'}
                onClick={e => {
                  this.onMenuItemClick(e, 'elasticsearch')
                }}
              /> */}
              {/* <MenuItem
                title='Push Service'
                active={this.state.activeCategory === 'settings-tps'}
                onClick={e => {
                  this.onMenuItemClick(e, 'tps')
                }}
              /> */}
              {/* <MenuItem
                title='Backup/Restore'
                active={this.state.activeCategory === 'settings-backup'}
                onClick={e => {
                  this.onMenuItemClick(e, 'backup')
                }}
              /> */}
              {/* <MenuItem
                title='Legal'
                active={this.state.activeCategory === 'settings-legal'}
                onClick={e => {
                  this.onMenuItemClick(e, 'legal')
                }}
              /> */}
            </Menu>
          </div>
        </div>
        <div className='uk-width-5-6 uk-width-xLarge-9-10'>
          <div
            className='page-title-right noshadow page-title-border-bottom'
            style={{ borderTop: 'none', height: '69px' }}
          />
          <div className='page-wrapper full-height scrollable no-overflow-x' ref={i => (this.page = i)}>
            <div className='settings-wrap'>
              <GeneralSettings active={this.state.activeCategory === 'settings-general'} common={this.props.common} t={this.props.t}/>
              <AppearanceSettings active={this.state.activeCategory === 'settings-appearance'} common={this.props.common} t={this.props.t}/>
              <PermissionsSettingsContainer active={this.state.activeCategory === 'settings-permissions'} common={this.props.common} t={this.props.t}/>
              <TicketsSettings active={this.state.activeCategory === 'settings-tickets'} common={this.props.common} t={this.props.t}/>
              <MailerSettingsContainer active={this.state.activeCategory === 'settings-mailer'} common={this.props.common} t={this.props.t}/>
              {/* <ElasticsearchSettingsContainer active={this.state.activeCategory === 'settings-elasticsearch'} common={this.props.common}/>
              <TPSSettingsContainer active={this.state.activeCategory === 'settings-tps'} common={this.props.common}/> */}
              {/* <BackupRestoreSettingsContainer active={this.state.activeCategory === 'settings-backup'} common={this.props.common}/>
              <LegalSettingsContainer active={this.state.activeCategory === 'settings-legal'} common={this.props.common}/> */}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

SettingsContainer.propTypes = {
  fetchSettings: PropTypes.func.isRequired,
  sidebar: PropTypes.object.isRequired,
  common: PropTypes.object.isRequired
}

const mapStateToProps = state => ({
  sidebar: state.sidebar,
  common: state.common
})

export default withTranslation(['common', 'settings'])(connect(
  mapStateToProps,
  { fetchSettings }
)(SettingsContainer))
