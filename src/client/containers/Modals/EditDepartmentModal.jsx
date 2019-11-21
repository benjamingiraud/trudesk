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
 *  Updated:    3/30/19 3:10 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import { connect } from 'react-redux'

import { fetchTeams, unloadTeams } from 'actions/teams'
import { fetchGroups, unloadGroups } from 'actions/groups'
import { updateDepartment } from 'actions/departments'

import BaseModal from 'containers/Modals/BaseModal'

import helpers from 'lib/helpers'
import $ from 'jquery'
import Button from 'components/Button'
import MultiSelect from 'components/MultiSelect'
import { withTranslation } from 'react-i18next';

@observer
class EditDepartmentModal extends React.Component {
  @observable name = new Map()
  @observable allGroups = false

  componentDidMount () {
    this.props.fetchTeams()
    this.props.fetchGroups({ type: 'all' })

    this.name = new Map()
    this.name.set('fr', this.props.department.get('name').get('fr'))
    this.name.set('en', this.props.department.get('name').get('en'))

    this.allGroups = this.props.department.get('allGroups')

    helpers.UI.inputs()
    helpers.UI.reRenderInputs()
    helpers.formvalidator()
  }

  componentDidUpdate () {
    helpers.UI.reRenderInputs()
    if (this.allGroups) this.groupSelect.selectAll()
  }

  componentWillUnmount () {
    this.props.unloadTeams()
    this.props.unloadGroups()
  }

  onInputChange (e, code) {
    this.name.set(code, e.target.value)
  }

  onFormSubmit (e) {
    e.preventDefault()
    const $form = $(e.target)
    if (!$form.isValid(null, null, false)) return false

    const payload = {
      _id: this.props.department.get('_id'),
      name: this.name,
      teams: this.teamsSelect.getSelected(),
      allGroups: this.allGroups,
      groups: this.allGroups ? [] : this.groupSelect.getSelected()
    }

    this.props.updateDepartment(payload)
  }

  render () {
    const { department, t } = this.props
    const departmentTeams = department.get('teams')
    const departmentGroups = department.get('groups')
    const mappedTeams = this.props.teams
      .map(team => {
        return { text: team.get('name').get(this.props.lng), value: team.get('_id') }
      })
      .toArray()

    const mappedGroups = this.props.groups
      .map(group => {
        return { text: group.get('name').get(this.props.lng), value: group.get('_id') }
      })
      .toArray()

    return (
      <BaseModal {...this.props} options={{ bgclose: false }}>
        <div className={'mb-25'}>
          <h2>{t('Edit Department')}: <b>{department.get('name').get(this.props.lng)}</b></h2>
        </div>
        <form className={'uk-form-stacked'} onSubmit={e => this.onFormSubmit(e)}>
          <div className={'uk-margin-medium-bottom'}>
            <label>{t('Department Name')} (fr)</label>
            <input
              type='text'
              className={'md-input'}
              value={this.name.get('fr')}
              onChange={e => this.onInputChange(e, 'fr')}
              data-validation='length'
              data-validation-length={'min2'}
              data-validation-error-msg={'Please enter a valid department name. (Must contain 2 characters)'}
            />
            <label>{t('Department Name')} (en)</label>
            <input
              type='text'
              className={'md-input'}
              value={this.name.get('en')}
              onChange={e => this.onInputChange(e, 'en')}
              data-validation='length'
              data-validation-length={'min2'}
              data-validation-error-msg={'Please enter a valid department name. (Must contain 2 characters)'}
            />
          </div>
          <div className={'uk-margin-medium-bottom'}>
            <label style={{ marginBottom: 5 }}>{t('Teams')}</label>
            <MultiSelect
              items={mappedTeams}
              initialSelected={departmentTeams ? departmentTeams.map(d => d.get('_id')).toArray() : []}
              onChange={() => {}}
              ref={r => (this.teamsSelect = r)}
            />
          </div>
          <hr />
          <div className={'uk-margin-medium-bottom uk-clearfix'}>
            <div className='uk-float-left'>
              <h4 style={{ paddingLeft: 2 }}>{t('Access all current and new customer groups?')}</h4>
            </div>
            <div className='uk-float-right md-switch md-green' style={{ marginTop: 5 }}>
              <label>
                {t('Yes')}
                <input
                  type='checkbox'
                  checked={this.allGroups}
                  onChange={e => {
                    this.allGroups = e.target.checked
                    if (this.allGroups) this.groupSelect.selectAll()
                    else this.groupSelect.deselectAll()
                  }}
                />
                <span className={'lever'} />
              </label>
            </div>
          </div>
          <div className={'uk-margin-medium-bottom'}>
            <label style={{ marginBottom: 5 }}>{t('Customer Groups')}</label>
            <MultiSelect
              items={mappedGroups}
              onChange={() => {}}
              initialSelected={departmentGroups ? departmentGroups.map(d => d.get('_id')).toArray() : []}
              ref={r => (this.groupSelect = r)}
              disabled={this.allGroups}
            />
          </div>
          <div className='uk-modal-footer uk-text-right'>
            <Button text={t('Close')} flat={true} waves={true} extraClass={'uk-modal-close'} />
            <Button text={t('Save Department')} flat={true} waves={true} style={'primary'} type={'submit'} />
          </div>
        </form>
      </BaseModal>
    )
  }
}

EditDepartmentModal.propTypes = {
  department: PropTypes.object.isRequired,
  updateDepartment: PropTypes.func.isRequired,
  fetchTeams: PropTypes.func.isRequired,
  unloadTeams: PropTypes.func.isRequired,
  fetchGroups: PropTypes.func.isRequired,
  unloadGroups: PropTypes.func.isRequired,
  teams: PropTypes.object.isRequired,
  groups: PropTypes.object.isRequired
}

const mapStateToProps = state => ({
  teams: state.teamsState.teams,
  groups: state.groupsState.groups
})

export default withTranslation('common')(connect(
  mapStateToProps,
  { updateDepartment, fetchTeams, unloadTeams, fetchGroups, unloadGroups }
)(EditDepartmentModal))
