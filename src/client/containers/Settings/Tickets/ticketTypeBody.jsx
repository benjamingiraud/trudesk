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
 *  Updated:    2/3/19 1:20 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import Log from '../../../logger'
import $ from 'jquery'

import helpers from 'lib/helpers'
import { fetchSettings } from 'actions/settings'
import { updatePriority } from 'actions/tickets'
import { showModal } from 'actions/common'
import api from 'api/index'

import Button from 'components/Button'
import SettingSubItem from 'components/Settings/SettingSubItem'
import ButtonGroup from 'components/ButtonGroup'
import EditPriorityPartial from './editPriorityPartial'
import { withTranslation } from 'react-i18next';

class TicketTypeBody extends React.Component {
  constructor (props) {
    super(props)
    this.prioritiesRef = {}
    this.state = {
      lng: 'fr'
    }
  }

  componentDidMount () {
    helpers.UI.inputs()
    this.setState({ lng: this.props.i18n.language === 'FR-fr' || 'fr' ? 'fr' : 'en' })

  }

  handleTypeRename (event, locale) {
    event.preventDefault()

    let name = new Map()
    name.set('fr', this.props.type.get('name').get('fr'))
    name.set('en', this.props.type.get('name').get('en'))

    name.set(locale, event.target['name' + locale].value)

    api.tickets
      .renameTicketType(this.props.type.get('_id'), name)
      .then(response => {
        if (response.success) helpers.UI.showSnackbar('Type Updated Successfully')
        this.props.fetchSettings()
      })
      .catch(err => {
        helpers.UI.showSnackbar(err, true)
      })
  }

  onAddPriorityClick (e, type) {
    this.props.showModal('ADD_PRIORITY_TO_TYPE', { type })
  }

  toggleEditPriority (e, k) {
    const obj = this.prioritiesRef[k]
    const $v = $(obj).find('.view-priority')
    const $e = $(obj).find('.edit-priority')
    if ($v && $e) {
      $v.toggleClass('hide')
      $e.toggleClass('hide')
    }
  }

  onRemoveTicketTypePriorityClicked (e, priorityId) {
    e.preventDefault()

    api.tickets
      .removePriorityFromType({ typeId: this.props.type.get('_id'), priority: priorityId })
      .then(() => {
        helpers.UI.showSnackbar(`Priority removed from type: ${this.props.type.get('name').get(this.state.lng)}`)
        this.props.fetchSettings()
      })
      .catch(error => {
        if (!error.response) {
          Log.error(error)
          return
        }
        const errorText = error.response.data.error
        Log.error(errorText, error.response)
        helpers.UI.showSnackbar(`Error: ${errorText}`, true)
      })
  }

  showDeleteTicketTypeModal (e, type) {
    this.props.showModal('DELETE_TICKET_TYPE', { type })
  }

  render () {
    const { type, t } = this.props
    return (
      <div>
        <div className={'ticket-type-general-wrapper'}>
          <h2 className={'text-light'}>{t('General')}</h2>
          <hr style={{ margin: '5px 0 25px 0' }} />
          <form
            onSubmit={e => {
              this.handleTypeRename(e, 'fr')
            }}
            style={{marginBottom: '12px'}}
          >
            <div className='uk-input-group'>
              <label htmlFor='ticket-type-name'>{t('Type Name')} (fr)</label>
              <input name={'namefr'} type='text' className={'md-input'} defaultValue={type.get('name').get('fr')} />
              <div className='uk-input-group-addon'>
                <button type='submit' className={'md-btn md-btn-small'}>
                  {t('Rename')}
                </button>
              </div>
            </div>
          </form>
          <form
            onSubmit={e => {
              this.handleTypeRename(e, 'en')
            }}
          >
            <div className='uk-input-group'>
              <label htmlFor='ticket-type-name'>{t('Type Name')} (en)</label>
              <input name={'nameen'} type='text' className={'md-input'} defaultValue={type.get('name').get('en')} />
              <div className='uk-input-group-addon'>
                <button type='submit' className={'md-btn md-btn-small'}>
                  {t('Rename')}
                </button>
              </div>
            </div>
          </form>
        </div>
        <div className='ticket-type-priorities-wrapper uk-margin-medium-top'>
          <h2 className='text-light uk-display-inline-block'>
            {t('Priorities')}
            <i
              className='material-icons'
              style={{ color: '#888', fontSize: '16px', cursor: 'pointer', lineHeight: '18px', marginLeft: '5px' }}
              data-uk-tooltip="{cls:'long-text'}"
              title={t('Priorities linked to this type')}
            >
              help
            </i>
          </h2>
          <div className='uk-float-right'>
            <Button
              text={t('Add')}
              style={'success'}
              flat={true}
              waves={true}
              onClick={e => this.onAddPriorityClick(e, type)}
            />
          </div>
          <hr style={{ margin: '5px 0 25px 0' }} />
          <div className='priority-loop zone'>
            {type.get('priorities').map(item => {
              return (
                <div
                  key={item.get('_id')}
                  ref={i => (this.prioritiesRef[item.get('_id')] = i)}
                  className={'z-box uk-clearfix'}
                >
                  <div className={'view-priority uk-clearfix'}>
                    <SettingSubItem
                      title={item.get('name').get(this.state.lng)}
                      titleCss={{ color: item.get('htmlColor') }}
                      subtitle={
                        <div>
                          {t('SLA Overdue')} <strong>{item.get('durationFormatted')}</strong>
                        </div>
                      }
                      component={
                        <ButtonGroup classNames={'uk-float-right'}>
                          <Button
                            text={t('Edit')}
                            small={true}
                            onClick={e => this.toggleEditPriority(e, item.get('_id'))}
                          />
                          <Button
                            text={t('Remove')}
                            small={true}
                            style={'danger'}
                            onClick={e => this.onRemoveTicketTypePriorityClicked(e, item.get('_id'))}
                          />
                        </ButtonGroup>
                      }
                    />
                  </div>
                  <EditPriorityPartial priority={item} />
                </div>
              )
            })}
          </div>
        </div>
        <div className={'uk-margin-large-top'}>
          <h2 className='text-light'>{t('Danger Zone')}</h2>
          <div className='danger-zone'>
            <div className='dz-box uk-clearfix'>
              <div className='uk-float-left'>
                <h5>{t('Delete this type')}</h5>
                <p>{t('Delete this type desc')}</p>
              </div>
              <div className='uk-float-right' style={{ paddingTop: '10px' }}>
                <Button
                  text={t('Delete')}
                  small={true}
                  style={'danger'}
                  onClick={e => this.showDeleteTicketTypeModal(e, type)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

TicketTypeBody.propTypes = {
  type: PropTypes.object.isRequired,
  updatePriority: PropTypes.func.isRequired,
  fetchSettings: PropTypes.func.isRequired,
  showModal: PropTypes.func.isRequired
}

export default withTranslation('settings')(connect(
  null,
  { updatePriority, fetchSettings, showModal }
)(TicketTypeBody))
