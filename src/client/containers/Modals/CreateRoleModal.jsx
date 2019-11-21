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
 *  Updated:    2/16/19 4:29 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { observable } from 'mobx'
import { connect } from 'react-redux'

import { createRole } from 'actions/settings'

import Button from 'components/Button'
import BaseModal from './BaseModal'
import { withTranslation } from 'react-i18next';

@observer
class CreateRoleModal extends React.Component {
  @observable name = new Map([['fr', ''], ['en', '']])

  onNameChange (e, locale) {
    this.name.set(locale, e.target.value)
  }

  onCreateRoleClicked (e) {
    e.preventDefault()

    this.props.createRole({ name: this.name })
  }

  render () {
    const { t } = this.props

    return (
      <BaseModal>
        <div className={'uk-form-stacked'}>
          <div>
            <h2 className={'nomargin mb-5'}>{t('Create Role')}</h2>
            <p className='uk-text-muted'>{t('Once created, the role will become editable in the permission editor')}</p>

            <label>{t('Role Name')} (fr)</label>
            <input
              type='text'
              className={'md-input'}
              name={'namefr'}
              data-validation='length'
              data-validation-length='min3'
              data-validation-error-msg='Please enter a valid role name. Role name must contain at least 3 characters.'
              value={this.name.get('fr')}
              onChange={e => this.onNameChange(e, 'fr')}
            />
            <label>{t('Role Name')} (en)</label>
            <input
              type='text'
              className={'md-input'}
              name={'nameen'}
              data-validation='length'
              data-validation-length='min3'
              data-validation-error-msg='Please enter a valid role name. Role name must contain at least 3 characters.'
              value={this.name.get('en')}
              onChange={e => this.onNameChange(e, 'en')}
            />
          </div>
          <div className='uk-modal-footer uk-text-right'>
            <Button text={t('Close')} extraClass={'uk-modal-close'} flat={true} waves={true} />
            <Button
              text={t('Create')}
              type={'button'}
              flat={true}
              waves={true}
              style={'success'}
              onClick={e => this.onCreateRoleClicked(e)}
            />
          </div>
        </div>
      </BaseModal>
    )
  }
}

CreateRoleModal.propTypes = {
  createRole: PropTypes.func.isRequired
}

export default withTranslation('common')(connect(
  null,
  { createRole }
)(CreateRoleModal))
