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
 *  Updated:    2/6/19 12:30 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import BaseModal from './BaseModal'
import Button from 'components/Button'

import { createTag } from 'actions/tickets'
import { withTranslation } from 'react-i18next';

class CreateTagModal extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      name: new Map([['fr', ''], ['en', '']])
    }
  }

  onNameChange (e, locale) {
    let name = this.state.name
    name.set(locale, e.target.value)
    this.setState({
      name
    })
  }

  onSubmit (e) {
    e.preventDefault()
    let name = {
      'fr': this.state.name.get('fr'),
      'en': this.state.name.get('en')
    }
    if (this.props.page === 'settings')
      return this.props.createTag({ name, currentPage: this.props.currentPage })

    this.props.createTag({ name })
  }

  render () {
    const { t } = this.props

    return (
      <BaseModal>
        <form className='uk-form-stacked' onSubmit={e => this.onSubmit(e)}>
          <div>
            <h2 className={'nomargin mb-5'}>{t('Create Tag')}</h2>
            <p className='uk-text-muted'>{t('Tags categorize tickets, making it easy to identify issues')}</p>

            <label>{t('Tag Name')} (fr)</label>
            <input
              type='text'
              className={'md-input'}
              name={'namefr'}
              data-validation='length'
              data-validation-length='min2'
              data-validation-error-msg='Please enter a valid tag name. Tag name must contain at least 2 characters.'
              value={this.state.name.get('fr')}
              onChange={e => this.onNameChange(e, 'fr')}
            />
            <label>{t('Tag Name')} (en)</label>
            <input
              type='text'
              className={'md-input'}
              name={'nameen'}
              data-validation='length'
              data-validation-length='min2'
              data-validation-error-msg='Please enter a valid tag name. Tag name must contain at least 2 characters.'
              value={this.state.name.get('en')}
              onChange={e => this.onNameChange(e, 'en')}
            />
          </div>
          <div className='uk-modal-footer uk-text-right'>
            <Button text={t('Close')} extraClass={'uk-modal-close'} flat={true} waves={true} />
            <Button text={t('Create')} type={'submit'} flat={true} waves={true} style={'success'} />
          </div>
        </form>
      </BaseModal>
    )
  }
}

CreateTagModal.propTypes = {
  createTag: PropTypes.func.isRequired,
  page: PropTypes.string,
  currentPage: PropTypes.number
}

export default withTranslation('common')(connect(
  null,
  { createTag }
)(CreateTagModal))
