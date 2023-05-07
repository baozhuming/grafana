import { css } from '@emotion/css';
import React, { PureComponent } from 'react';

import { ConfirmButton, ConfirmModal, Button } from '@grafana/ui';
import { contextSrv } from 'app/core/core';
import { i18nDate } from 'app/core/internationalization';
import { AccessControlAction, UserSession } from 'app/types';

interface Props {
  sessions: UserSession[];

  onSessionRevoke: (id: number) => void;
  onAllSessionsRevoke: () => void;
}

interface State {
  showLogoutModal: boolean;
}

class BaseUserSessions extends PureComponent<Props, State> {
  forceAllLogoutButton = React.createRef<HTMLButtonElement>();
  state: State = {
    showLogoutModal: false,
  };

  showLogoutConfirmationModal = () => {
    this.setState({ showLogoutModal: true });
  };

  dismissLogoutConfirmationModal = () => {
    this.setState({ showLogoutModal: false }, () => {
      this.forceAllLogoutButton.current?.focus();
    });
  };

  onSessionRevoke = (id: number) => {
    return () => {
      this.props.onSessionRevoke(id);
    };
  };

  onAllSessionsRevoke = () => {
    this.setState({ showLogoutModal: false });
    this.props.onAllSessionsRevoke();
  };

  render() {
    const { sessions } = this.props;
    const { showLogoutModal } = this.state;

    const logoutFromAllDevicesClass = css`
      margin-top: 0.8rem;
    `;

    const canLogout = contextSrv.hasPermission(AccessControlAction.UsersLogout);

    return (
      <>
        <h3 className="page-heading">会话</h3>
        <div className="gf-form-group">
          <div className="gf-form">
            <table className="filter-table form-inline">
              <thead>
                <tr>
                  <th>最后上线</th>
                  <th>登录</th>
                  <th>IP地址</th>
                  <th colSpan={2}>浏览器和操作系统</th>
                </tr>
              </thead>
              <tbody>
                {sessions &&
                  sessions.map((session, index) => (
                    <tr key={`${session.id}-${index}`}>
                      <td>{session.isActive ? '现在' : session.seenAt}</td>
                      <td>{i18nDate(session.createdAt, { dateStyle: 'long' })}</td>
                      <td>{session.clientIp}</td>
                      <td>{`${session.browser} on ${session.os} ${session.osVersion}`}</td>
                      <td>
                        <div className="pull-right">
                          {canLogout && (
                            <ConfirmButton
                              confirmText="确认注销"
                              confirmVariant="destructive"
                              onConfirm={this.onSessionRevoke(session.id)}
                              autoFocus
                            >
                              确认注销
                            </ConfirmButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className={logoutFromAllDevicesClass}>
            {canLogout && sessions.length > 0 && (
              <Button variant="secondary" onClick={this.showLogoutConfirmationModal} ref={this.forceAllLogoutButton}>
                强制从所有设备注销
              </Button>
            )}
            <ConfirmModal
              isOpen={showLogoutModal}
              title="强制从所有设备注销"
              body="您确定要强制从所有设备注销吗?"
              confirmText="注销"
              onConfirm={this.onAllSessionsRevoke}
              onDismiss={this.dismissLogoutConfirmationModal}
            />
          </div>
        </div>
      </>
    );
  }
}

export const UserSessions = BaseUserSessions;
