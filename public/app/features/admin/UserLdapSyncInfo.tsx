import React, { PureComponent } from 'react';

import { dateTimeFormat } from '@grafana/data';
import { Button, LinkButton } from '@grafana/ui';
import { contextSrv } from 'app/core/core';
import { AccessControlAction, SyncInfo, UserDTO } from 'app/types';

interface Props {
  ldapSyncInfo: SyncInfo;
  user: UserDTO;
  onUserSync: () => void;
}

interface State {}

const format = 'dddd YYYY-MM-DD HH:mm zz';
const debugLDAPMappingBaseURL = '/admin/ldap';

export class UserLdapSyncInfo extends PureComponent<Props, State> {
  onUserSync = () => {
    this.props.onUserSync();
  };

  render() {
    const { ldapSyncInfo, user } = this.props;
    const nextSyncSuccessful = ldapSyncInfo && ldapSyncInfo.nextSync;
    const nextSyncTime = nextSyncSuccessful ? dateTimeFormat(ldapSyncInfo.nextSync, { format }) : '';
    const debugLDAPMappingURL = `${debugLDAPMappingBaseURL}?user=${user && user.login}`;
    const canReadLDAPUser = contextSrv.hasPermission(AccessControlAction.LDAPUsersRead);
    const canSyncLDAPUser = contextSrv.hasPermission(AccessControlAction.LDAPUsersSync);

    return (
      <>
        <h3 className="page-heading">LDAP同步</h3>
        <div className="gf-form-group">
          <div className="gf-form">
            <table className="filter-table form-inline">
              <tbody>
                <tr>
                  <td>外部同步</td>
                  <td>通过LDAP同步的用户，必须在LDAP或映射中进行一些更改</td>
                  <td>
                    <span className="label label-tag">LDAP</span>
                  </td>
                </tr>
                <tr>
                  {ldapSyncInfo.enabled ? (
                    <>
                      <td>下一个计划同步</td>
                      <td colSpan={2}>{nextSyncTime}</td>
                    </>
                  ) : (
                    <>
                      <td>下一个计划同步</td>
                      <td colSpan={2}>未启用</td>
                    </>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="gf-form-button-row">
            {canSyncLDAPUser && (
              <Button variant="secondary" onClick={this.onUserSync}>
                同步用户
              </Button>
            )}
            {canReadLDAPUser && (
              <LinkButton variant="secondary" href={debugLDAPMappingURL}>
                调试LDAP同步
              </LinkButton>
            )}
          </div>
        </div>
      </>
    );
  }
}
