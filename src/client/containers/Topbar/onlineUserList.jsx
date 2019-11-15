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
 *  Updated:    2/12/19 11:49 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import moment from 'moment-timezone'
import { observer } from 'mobx-react'
import { observable, entries } from 'mobx'
import { isUndefined } from 'lodash'

import OffCanvas from 'components/OffCanvas'

import UIkit from 'uikit'
import socket from 'lib/socket'

import { withTranslation } from 'react-i18next';

@observer
class OnlineUserListPartial extends React.Component {
  @observable activeUsers = new Map()

  constructor (props) {
    super(props)

    this.onSocketUpdateUsers = this.onSocketUpdateUsers.bind(this)
  }

  componentDidMount () {
    socket.socket.on('updateUsers', this.onSocketUpdateUsers)
  }

  componentWillUnmount () {
    socket.socket.off('updateUsers', this.onSocketUpdateUsers)
  }

  onSocketUpdateUsers (data) {
    this.activeUsers.replace(data)
  }

  isActiveUser (username) {
    return !!this.activeUsers.get(username)
  }

  static onUserClicked (e, id) {
    e.preventDefault()
    socket.socket.emit('spawnChatWindow', id)
    UIkit.offcanvas.hide()
  }

  static fromNow (timezone, date) {
    if (isUndefined(date)) {
      return 'Never'
    }
    moment.updateLocale('en', {
      relativeTime: {
        future: 'in %s',
        past: '%s ago',
        s: 'a few seconds',
        m: '1m',
        mm: '%dm',
        h: '1h',
        hh: '%dh',
        d: '1d',
        dd: '%dd',
        M: '1mo',
        MM: '%dmos',
        y: '1y',
        yy: '%dyrs'
      }
    })

    return moment
      .utc(date)
      .tz(timezone)
      .fromNow()
  }

  render () {
    const { timezone, users, t } = this.props
    return (
      <OffCanvas title={t('Online_Users')} id={'online-user-list'}>
        <div style={{ padding: '0 5px' }}>
          <div className='active-now'>
            <h5>{t('Active_Now')}</h5>
            <div className='online-list-wrapper'>
              <ul className='online-list'>
                {entries(this.activeUsers).map(([key, value]) => {
                  if (this.props.sessionUser && value.user.id === this.props.sessionUser._id) return
                  const image = value.user.image || 'defaultProfile.jpg'
                  const isAgentOrAdmin = value.user.role.isAdmin || value.user.role.isAgent
                  return (
                    <li key={key}>
                      <a className={'no-ajaxy'} onClick={e => OnlineUserListPartial.onUserClicked(e, value.user.id)}>
                        <div className='user-list-user'>
                          <div className='image'>
                            <img src={`/uploads/users/${image}`} alt='Profile Pic' />
                          </div>
                          <span className='online-status' data-user-status-id={value.user.id} />
                          <div className={'user-name' + (isAgentOrAdmin ? ' _agent' : '')}>
                            {value.user.fullname + (isAgentOrAdmin ? ' - Agent' : '')}
                          </div>
                        </div>
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      </OffCanvas>
    )
  }
}

OnlineUserListPartial.propTypes = {
  sessionUser: PropTypes.object,
  timezone: PropTypes.string.isRequired,
  users: PropTypes.array.isRequired
}

export default withTranslation('common')(OnlineUserListPartial)
