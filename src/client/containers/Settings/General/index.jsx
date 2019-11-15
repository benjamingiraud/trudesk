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
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import moment from 'moment-timezone'
import { updateSetting } from 'actions/settings'

import SettingItem from 'components/Settings/SettingItem'

import InputWithSave from 'components/Settings/InputWithSave'
import SingleSelect from 'components/SingleSelect'
import EnableSwitch from 'components/Settings/EnableSwitch'
import SettingSubItem from 'components/Settings/SettingSubItem'
import Zone from 'components/ZoneBox/zone'
import ZoneBox from 'components/ZoneBox'
// import { withTranslation } from 'react-i18next';

class GeneralSettings extends React.Component {
  constructor (props) {
    super(props)
  }

  componentDidMount () {}
  componentWillUnmount () {}

  getSettingsValue (name) {
    return this.props.settings.getIn(['settings', name, 'value'])
      ? this.props.settings.getIn(['settings', name, 'value'])
      : ''
  }

  updateSetting (stateName, name, value) {
    this.props.updateSetting({ stateName, name, value })
  }

  getTimezones () {
    return moment.tz
      .names()
      .map(function (name) {
        const year = new Date().getUTCFullYear()
        const timezoneAtBeginningOfyear = moment.tz(year + '-01-01', name)
        return {
          utc: timezoneAtBeginningOfyear.utcOffset(),
          text: '(GMT' + timezoneAtBeginningOfyear.format('Z') + ') ' + name,
          value: name
        }
      })
      .sort(function (a, b) {
        return a.utc - b.utc
      })
  }

  onTimezoneChange (e) {
    if (e.target.value) this.updateSetting('timezone', 'gen:timezone', e.target.value)
  }

  render () {
    const { active, t } = this.props

    const SiteTitle = (
      <InputWithSave stateName='siteTitle' settingName='gen:sitetitle' value={this.getSettingsValue('siteTitle')} />
    )

    const SiteUrl = (
      <InputWithSave stateName='siteUrl' settingName='gen:siteurl' value={this.getSettingsValue('siteUrl')} />
    )

    const Timezone = (
      <SingleSelect
        stateName='timezone'
        settingName='gen:timezone'
        items={this.getTimezones()}
        defaultValue={this.getSettingsValue('timezone')}
        onSelectChange={e => {
          this.onTimezoneChange(e)
        }}
        showTextbox={true}
      />
    )

    const AllowUserRegistration = (
      <EnableSwitch
        stateName='allowUserRegistration'
        label='Enable'
        checked={this.getSettingsValue('allowUserRegistration')}
        onChange={e => {
          this.updateSetting('allowUserRegistration', 'allowUserRegistration:enable', e.target.checked)
        }}
      />
    )

    return (
      <div className={active ? 'active' : 'hide'}>
        <SettingItem
          title={t('Site_Title')}
          subtitle={
            <div>
              {t('Site_Title_desc')}
            </div>
          }
          component={SiteTitle}
        />
        {/* <SettingItem
          title='Site Url'
          subtitle={
            <div>
              Publicly accessible URL of this site. <i>ex: {this.props.viewdata.hosturl}</i>
            </div>
          }
          component={SiteUrl}
        /> */}
        <SettingItem
          title={t('Time Zone')}
          subtitle={t('Time Zone Legend')}
          component={Timezone}
        />
        <SettingItem
          title={t('Time Date Format')}
          subtitle={
            <a href='https://momentjs.com/docs/#/displaying/format/' rel='noopener noreferrer' target='_blank'>
              Moment.js Format Options
            </a>
          }
        >
          <Zone>
            <ZoneBox>
              <SettingSubItem
                title={t('Time Format')}
                subtitle={t('Time Format Legend')}
                component={
                  <InputWithSave
                    stateName='timeFormat'
                    settingName='gen:timeFormat'
                    value={this.getSettingsValue('timeFormat')}
                    width={'60%'}
                  />
                }
              />
            </ZoneBox>
            <ZoneBox>
              <SettingSubItem
                title={t('Short Date Format')}
                subtitle={t('Short Date Format Legend')}
                component={
                  <InputWithSave
                    stateName='shortDateFormat'
                    settingName='gen:shortDateFormat'
                    value={this.getSettingsValue('shortDateFormat')}
                    width={'60%'}
                  />
                }
              />
            </ZoneBox>
            <ZoneBox>
              <SettingSubItem
                title={t('Long Date Format')}
                subtitle={t('Long Date Format Legend')}
                component={
                  <InputWithSave
                    stateName='longDateFormat'
                    settingName='gen:longDateFormat'
                    value={this.getSettingsValue('longDateFormat')}
                    width={'60%'}
                  />
                }
              />
            </ZoneBox>
          </Zone>
        </SettingItem>
        {/* <SettingItem
          title='Allow User Registration'
          subtitle='Allow users to create accounts on the login screen.'
          component={AllowUserRegistration}
        /> */}
      </div>
    )
  }
}

GeneralSettings.propTypes = {
  active: PropTypes.bool,
  updateSetting: PropTypes.func.isRequired,
  viewdata: PropTypes.object.isRequired,
  settings: PropTypes.object.isRequired
}

const mapStateToProps = state => ({
  viewdata: state.common,
  settings: state.settings.settings
})

export default connect(
  mapStateToProps,
  { updateSetting }
)(GeneralSettings)
