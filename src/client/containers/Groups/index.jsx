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
 *  Updated:    4/12/19 12:23 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { fetchGroups, deleteGroup } from 'actions/groups'
import { showModal } from 'actions/common'

import PageTitle from 'components/PageTitle'
import PageContent from 'components/PageContent'
import Button from 'components/Button'
import Table from 'components/Table'
import TableHeader from 'components/Table/TableHeader'
import TableRow from 'components/Table/TableRow'
import TableCell from 'components/Table/TableCell'
import ButtonGroup from 'components/ButtonGroup'

import UIKit from 'uikit'
import helpers from 'lib/helpers'

import { withTranslation } from 'react-i18next';

class GroupsContainer extends React.Component {
  componentDidMount () {
    this.props.fetchGroups({ type: 'all' })
    this.setState({ lng: this.props.i18n.language === 'FR-fr' || 'fr' ? 'fr' : 'en' })

  }

  onCreateGroupClick () {
    this.props.showModal('CREATE_GROUP')
  }

  onEditGroupClick (group) {
    this.props.showModal('EDIT_GROUP', { group })
  }

  onDeleteGroupClick (_id) {
    UIKit.modal.confirm(
      `<h2>Are you sure?</h2>
        <p style="font-size: 15px;">
            <span class="uk-text-danger" style="font-size: 15px;">This is a permanent action.</span> 
        </p>
        <p style="font-size: 12px;">
            Agents may lose access to resources once this group is deleted.
        </p>
        <span>Groups that are associated with ticket cannot be deleted.</span>
        `,
      () => {
        this.props.deleteGroup({ _id })
      },
      {
        labels: { Ok: 'Yes', Cancel: 'No' },
        confirmButtonClass: 'md-btn-danger'
      }
    )
  }

  render () {
    const { groups, t } = this.props

    const tableItems = groups.map(group => {
      return (
        <TableRow key={group.get('_id')} className={'vam nbb'}>
          <TableCell style={{ fontWeight: 500, padding: '18px 15px' }}>{group.get('name').get(this.state.lng)}</TableCell>
          <TableCell style={{ padding: '13px 20px 8px 8px' }}>
            {group.get('members') &&
              group.get('members').size > 0 &&
              group
                .get('members')
                .filter(user => {
                  return user.get('enabled')
                })
                .map(user => {
                  const profilePic = 'defaultProfile.jpg'
                  return (
                    <div
                      key={user.get('id')}
                      className={'uk-float-left uk-position-relative mb-10'}
                      data-uk-tooltip={'{pos: "bottom"}'}
                      title={user.get('firstname') + ' ' + user.get('lastname')}
                    >
                      <img
                        style={{ width: 25, height: 25, marginRight: 5 }}
                        className={'round'}
                        src={`/uploads/users/${profilePic}`}
                        alt={user.get('firstname') + ' ' + user.get('lastname')}
                      />
                      <span
                        data-user-status-id={user.get('id')}
                        className='user-offline uk-border-circle'
                        style={{ width: 13, height: 13 }}
                      />
                    </div>
                  )
                })}
            {!group.get('members') && <div />}
          </TableCell>
          <TableCell style={{ textAlign: 'right', paddingRight: 15 }}>
            <ButtonGroup>
              {helpers.canUser('groups:update', true) && (
                <Button text={t('Edit')} small={true} waves={true} onClick={() => this.onEditGroupClick(group.toJS())} />
              )}
              {helpers.canUser('groups:delete', true) && (
                <Button
                  text={t('Delete')}
                  style={'danger'}
                  small={true}
                  waves={true}
                  onClick={() => this.onDeleteGroupClick(group.get('_id'))}
                />
              )}
            </ButtonGroup>
          </TableCell>
        </TableRow>
      )
    })

    return (
      <div>
        <PageTitle
          title={t('Customer Groups')}
          rightComponent={
            <div className={'uk-grid uk-grid-collapse'}>
              <div className={'uk-width-1-1 mt-15 uk-text-right'}>
                <Button
                  text={t('Create')}
                  flat={false}
                  small={true}
                  waves={false}
                  extraClass={'hover-accent'}
                  onClick={() => this.onCreateGroupClick()}
                />
              </div>
            </div>
          }
        />
        <PageContent padding={0} paddingBottom={0}>
          <Table
            headers={[
              <TableHeader key={0} width={'25%'} height={40} text={t('Name')} padding={'8px 8px 8px 15px'} />,
              <TableHeader key={1} width={'50%'} text={t('Group Members')} />,
              <TableHeader key={2} width={130} text={'Actions'} />
            ]}
          >
            {tableItems}
          </Table>
        </PageContent>
      </div>
    )
  }
}

GroupsContainer.propTypes = {
  groups: PropTypes.object.isRequired,
  fetchGroups: PropTypes.func.isRequired,
  deleteGroup: PropTypes.func.isRequired,
  showModal: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
  groups: state.groupsState.groups
})

export default withTranslation('common')(connect(
  mapStateToProps,
  { fetchGroups, deleteGroup, showModal }
)(GroupsContainer))
