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
 *  Updated:    4/12/19 12:21 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { observable } from 'mobx'
import { observer } from 'mobx-react'

import { fetchAccounts, unloadAccounts } from 'actions/accounts'
import { createGroup } from 'actions/groups'

import BaseModal from 'containers/Modals/BaseModal'
import MultiSelect from 'components/MultiSelect'
import Button from 'components/Button'

import helpers from 'lib/helpers'
import $ from 'jquery'
import { withTranslation } from 'react-i18next';


@observer
class CreateGroupModal extends React.Component {
  @observable name = new Map()

  componentDidMount () {
    this.props.fetchAccounts({ type: 'customers' })
    this.name.set('fr', '')
    this.name.set('en', '')
    helpers.UI.inputs()
    helpers.UI.reRenderInputs()
    helpers.formvalidator()
  }

  componentDidUpdate () {
    helpers.UI.reRenderInputs()
  }

  componentWillUnmount () {
    this.props.unloadAccounts()
  }

  onInputChange(e, code) {
    this.name.set(code, e.target.value)
  }

  onFormSubmit (e) {
    e.preventDefault()

    const $form = $(e.target)
    if (!$form.isValid(null, null, false)) return false

    const postData = {
      name: this.name,
      members: this.membersSelect.getSelected() || []
    }

    this.props.createGroup(postData)
  }

  render () {
    const { t } = this.props;

    const mappedAccounts = this.props.accounts
      .map(account => {
        return { text: `${account.get('firstname')} ${account.get('lastname')}`, value: account.get('id') }
      })
      .toArray()
    return (
      <BaseModal>
        <div className={'mb-25'}>
          <h2>{t('Create Group')}</h2>
        </div>
        <form className={'uk-form-stacked'} onSubmit={e => this.onFormSubmit(e)}>
          <div className={'uk-margin-medium-bottom'}>
            <label>{t('Group Name')} (fr)</label>
            <input
              type='text'
              className={'md-input'}
              value={this.name.get('fr')}
              onChange={e => this.onInputChange(e, 'fr')}
              data-validation='length'
              data-validation-length={'min2'}
              data-validation-error-msg={'Please enter a valid Group name. (Must contain 2 characters)'}
            />
            <label>{t('Group Name')} (en)</label>
            <input
              type='text'
              className={'md-input'}
              value={this.name.get('en')}
              onChange={e => this.onInputChange(e, 'en')}
              data-validation='length'
              data-validation-length={'min2'}
              data-validation-error-msg={'Please enter a valid Group name. (Must contain 2 characters)'}
            />
          </div>
          <div className={'uk-margin-medium-bottom'}>
            <label style={{ marginBottom: 5 }}>{t('Group Members')}</label>
            <MultiSelect items={mappedAccounts} onChange={() => {}} ref={r => (this.membersSelect = r)} />
          </div>
          <div className='uk-modal-footer uk-text-right'>
            <Button text={t('Close')} flat={true} waves={true} extraClass={'uk-modal-close'} />
            <Button text={t('Create Group')} flat={true} waves={true} style={'primary'} type={'submit'} />
          </div>
        </form>
      </BaseModal>
    )
  }
}

CreateGroupModal.propTypes = {
  accounts: PropTypes.object.isRequired,
  fetchAccounts: PropTypes.func.isRequired,
  unloadAccounts: PropTypes.func.isRequired,
  createGroup: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
  accounts: state.accountsState.accounts
})

export default withTranslation('common')(connect(
  mapStateToProps,
  { createGroup, fetchAccounts, unloadAccounts }
)(CreateGroupModal))
