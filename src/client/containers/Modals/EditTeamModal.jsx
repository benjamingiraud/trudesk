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
 *  Updated:    3/27/19 11:41 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import { connect } from 'react-redux'

import { fetchAccounts, unloadAccounts } from 'actions/accounts'
import { saveEditTeam } from 'actions/teams'

import BaseModal from 'containers/Modals/BaseModal'

import helpers from 'lib/helpers'
import Button from 'components/Button'
import MultiSelect from 'components/MultiSelect'
import $ from 'jquery'
import SpinLoader from 'components/SpinLoader'
import { withTranslation } from 'react-i18next';

@observer
class EditTeamModal extends React.Component {
  @observable name = new Map()

  componentDidMount () {
    this.props.fetchAccounts({ type: 'all', limit: -1 })
    this.name.set('fr', this.props.team.name['fr'])
    this.name.set('en', this.props.team.name['en'])


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

  onSaveTeamEdit (e) {
    e.preventDefault()
    const $form = $(e.target)
    if (!$form.isValid(null, null, false)) return false

    const payload = {
      _id: this.props.team._id,
      name: this.name,
      members: this.membersSelect.getSelected().map(id => parseInt(id)) || []
    }

    this.props.saveEditTeam(payload)
  }

  render () {
    const mappedAccounts = this.props.accounts
      .filter(account => {
        return account.getIn(['role', 'isAgent']) === true && account.get('enabled')
      })
      .map(account => {
        console.log(typeof account.get('id'))
        return { text: account.get('firstname') + ' ' + account.get('lastname'), value: '' + account.get('id') }
      })
      .toArray()
    const selectedMembers = this.props.team.members.map(m => '' + m)
    console.log(selectedMembers)
    const { t } = this.props 
    return (
      <BaseModal {...this.props} options={{ bgclose: false }}>
        <SpinLoader active={this.props.accountsLoading} />
        <div className={'mb-25'}>
          <h2>{t('Edit Team')}</h2>
        </div>
        <form className={'uk-form-stacked'} onSubmit={e => this.onSaveTeamEdit(e)}>
          <div className={'uk-margin-medium-bottom'}>
            <label>{t('Team Name')} (fr)</label>
            <input
              type='text'
              className={'md-input'}
              value={this.name.get('fr')}
              onChange={e => this.onInputChange(e, 'fr')}
              data-validation='length'
              data-validation-length={'2-25'}
              data-validation-error-msg={'Please enter a valid Team name. (Must contain 2 characters)'}
            />
            <label>{t('Team Name')} (en)</label>
            <input
              type='text'
              className={'md-input'}
              value={this.name.get('en')}
              onChange={e => this.onInputChange(e, 'en')}
              data-validation='length'
              data-validation-length={'2-25'}
              data-validation-error-msg={'Please enter a valid Team name. (Must contain 2 characters)'}
            />
          </div>
          <div className={'uk-margin-medium-bottom'}>
            <label style={{ marginBottom: 5 }}>{t('Team Members')}</label>
            <MultiSelect
              items={mappedAccounts}
              initialSelected={selectedMembers}
              onChange={() => {}}
              ref={r => (this.membersSelect = r)}
            />
          </div>
          <div className='uk-modal-footer uk-text-right'>
            <Button text={t('Close')} flat={true} waves={true} extraClass={'uk-modal-close'} />
            <Button text={t('Save Team')} flat={true} waves={true} style={'primary'} type={'submit'} />
          </div>
        </form>
      </BaseModal>
    )
  }
}

EditTeamModal.propTypes = {
  team: PropTypes.object.isRequired,
  fetchAccounts: PropTypes.func.isRequired,
  unloadAccounts: PropTypes.func.isRequired,
  saveEditTeam: PropTypes.func.isRequired,
  accounts: PropTypes.object.isRequired,
  accountsLoading: PropTypes.bool.isRequired
}

const mapStateToProps = state => ({
  accounts: state.accountsState.accounts,
  accountsLoading: state.accountsState.loading
})

export default withTranslation('common')(connect(
  mapStateToProps,
  { fetchAccounts, unloadAccounts, saveEditTeam }
)(EditTeamModal))
