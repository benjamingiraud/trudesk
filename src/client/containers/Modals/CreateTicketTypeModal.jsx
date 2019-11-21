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
 *  Updated:    2/3/19 8:28 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { createTicketType } from 'actions/tickets'
import BaseModal from './BaseModal'
import Button from 'components/Button'
import { withTranslation } from 'react-i18next';

import $ from 'jquery'
import helpers from 'lib/helpers'

class CreateTicketTypeModal extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      name : new Map([['fr', ''], ['en', '']])
    }
  }

  componentDidMount () {
    helpers.UI.inputs()
    helpers.formvalidator()
  }

  onTypeNameChanged (e, locale) {
    let name = this.state.name
    name.set(locale, e.target.value)
    this.setState({
      name
    })
  }

  onCreateTicketTypeSubmit (e) {
    // e.preventDefault()
    // const $form = $(e.target)
    // if (!$form.isValid(null, null, false)) return true
    let name = {
      'fr': this.state.name.get('fr'),
      'en': this.state.name.get('en')
    }
    //  Form is valid... Submit..
    this.props.createTicketType({ name })
  }

  render () {
    const { t } = this.props

    return (
      <BaseModal {...this.props} ref={i => (this.base = i)}>
        <form className={'uk-form-stacked'} onSubmit={e => this.onCreateTicketTypeSubmit(e)}>
          <div>
            <h2 className='nomargin mb-5'>{t('Create Ticket Type')}</h2>
            <p className='uk-text-small uk-text-muted'>{t('Create Ticket Type')}</p>
            <label htmlFor='typeName'>{t('Type name')} (fr)</label>
            <input
              value={this.state.name.get('fr')}
              onChange={e => this.onTypeNameChanged(e, 'fr')}
              type='text'
              className={'md-input'}
              name={'namefr'}
              data-validation='length'
              data-validation-length='min3'
              data-validation-error-msg='Please enter a valid type name. Type name must contain at least 3 characters'
            />
            <label htmlFor='typeName'>{t('Type name')} (en)</label>
            <input
              value={this.state.name.get('en')}
              onChange={e => this.onTypeNameChanged(e, 'en')}
              type='text'
              className={'md-input'}
              name={'nameen'}
              data-validation='length'
              data-validation-length='min3'
              data-validation-error-msg='Please enter a valid type name. Type name must contain at least 3 characters'
            />
          </div>
          <div className='uk-modal-footer uk-text-right'>
            <Button text={t('Close')} flat={true} waves={true} extraClass={'uk-modal-close'} />
            <Button text={t('Create')} style={'success'} type={'submit'} />
          </div>
        </form>
      </BaseModal>
    )
  }
}

CreateTicketTypeModal.propTypes = {
  onTypeCreated: PropTypes.func,
  createTicketType: PropTypes.func.isRequired
}

export default withTranslation('common')(connect(
  null,
  { createTicketType }
)(CreateTicketTypeModal))
