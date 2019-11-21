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
 *  Updated:    4/12/19 12:20 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { observable } from 'mobx'
import { observer } from 'mobx-react'

import { fetchAccounts, unloadAccounts } from 'actions/accounts'
import { updateGroup } from 'actions/groups'

import BaseModal from 'containers/Modals/BaseModal'
import MultiSelect from 'components/MultiSelect'
import Button from 'components/Button'

import helpers from 'lib/helpers'
import $ from 'jquery'
import SpinLoader from 'components/SpinLoader'
import { withTranslation } from 'react-i18next';
// import Select from 'react-select';

@observer
class EditGroupModal extends React.Component {
  @observable name = new Map()
  componentDidMount () {
    this.props.fetchAccounts({ type: 'customers', limit: -1 })
    this.name = new Map()
    console.log(this.props.group.name)
    this.name.set('fr', this.props.group.name.fr)
    this.name.set('en', this.props.group.name.en)
    // this.swiziGroups = []
    // for (let i = 0; i < selectedGroups.length; i++) {
    //   let swiziGroup = this.props.swiziGroups.find(sw => sw.id === selectedGroups[i])
    //   if (swiziGroup) this.swiziGroups.push({ label: swiziGroup.label, value: swiziGroup.id })
    // }
     
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

  onFormSubmit (e) {
    e.preventDefault()
    const $form = $(e.target)
    if (!$form.isValid(null, null, false)) return false

    const payload = {
      _id: this.props.group._id,
      name: this.name,
      members: this.membersSelect.getSelected().map(m => parseInt(m)) || [],
      sendMailTo: []
    }

    this.props.updateGroup(payload)
  }

  onInputChange(e, code) {
    this.name.set(code, e.target.value)
  }

  render () {
    const { t } = this.props;

    const mappedAccounts = this.props.accounts
      .map(account => {
        return { text: account.get('firstname') + ' ' + account.get('lastname'), value: account.get('id') }
      })
      .toArray()

    const selectedMembers = this.props.group.members.map(member => {
      return '' + member.id
    })

    // const swiziGroups = this.props.swiziGroups.map(group => {
    //   return { label: group.label, value: group.id }
    // })
    // const selectedSendMailTo = this.props.group.sendMailTo.map(member => {
    //   return member._id
    // })
    return (
      <BaseModal>
        <SpinLoader active={this.props.accountsLoading} />
        <div className={'mb-25'}>
          <h2>{t('Edit Group')}</h2>
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
          <div className='uk-margin-medium-bottom'>
            <label className='uk-form-label'>{t('SwiziGroups')}</label>
            <MultiSelect
              items={mappedAccounts}
              initialSelected={selectedMembers}
              onChange={() => { }}
              ref={r => (this.membersSelect = r)}
            />
          </div>
          {/* <div className={'uk-margin-medium-bottom'}>
            <label style={{ marginBottom: 5 }}>{t('Send Notifications To')}</label>
            <MultiSelect
              items={mappedAccounts}
              initialSelected={selectedSendMailTo}
              onChange={() => {}}
              ref={r => (this.sendMailToSelect = r)}
            />
          </div> */}
          <div className='uk-modal-footer uk-text-right'>
            <Button text={t('Close')} flat={true} waves={true} extraClass={'uk-modal-close'} />
            <Button text={t('Save Group')} flat={true} waves={true} style={'primary'} type={'submit'} />
          </div>
        </form>
      </BaseModal>
    )
  }
}

EditGroupModal.propTypes = {
  group: PropTypes.object.isRequired,
  accounts: PropTypes.object.isRequired,
  updateGroup: PropTypes.func.isRequired,
  fetchAccounts: PropTypes.func.isRequired,
  unloadAccounts: PropTypes.func.isRequired,
  accountsLoading: PropTypes.bool.isRequired
}

const mapStateToProps = state => ({
  accounts: state.accountsState.accounts,
  accountsLoading: state.accountsState.loading
})

export default withTranslation('common')(connect(
  mapStateToProps,
  { updateGroup, fetchAccounts, unloadAccounts }
)(EditGroupModal))
