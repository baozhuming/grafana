import { css, cx } from '@emotion/css';
import pluralize from 'pluralize';
import React, { useEffect, useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { GrafanaTheme2, OrgRole } from '@grafana/data';
import { Alert, ConfirmModal, FilterInput, Icon, LinkButton, RadioButtonGroup, Tooltip, useStyles2 } from '@grafana/ui';
import EmptyListCTA from 'app/core/components/EmptyListCTA/EmptyListCTA';
import { Page } from 'app/core/components/Page/Page';
import PageLoader from 'app/core/components/PageLoader/PageLoader';
import { contextSrv } from 'app/core/core';
import { StoreState, ServiceAccountDTO, AccessControlAction, ServiceAccountStateFilter } from 'app/types';

import { CreateTokenModal, ServiceAccountToken } from './components/CreateTokenModal';
import ServiceAccountListItem from './components/ServiceAccountsListItem';
import {
  changeQuery,
  fetchACOptions,
  fetchServiceAccounts,
  deleteServiceAccount,
  updateServiceAccount,
  changeStateFilter,
  createServiceAccountToken,
  getApiKeysMigrationStatus,
  getApiKeysMigrationInfo,
  closeApiKeysMigrationInfo,
} from './state/actions';

interface OwnProps {}

export type Props = OwnProps & ConnectedProps<typeof connector>;

function mapStateToProps(state: StoreState) {
  return {
    ...state.serviceAccounts,
  };
}

const mapDispatchToProps = {
  changeQuery,
  fetchACOptions,
  fetchServiceAccounts,
  deleteServiceAccount,
  updateServiceAccount,
  changeStateFilter,
  createServiceAccountToken,
  getApiKeysMigrationStatus,
  getApiKeysMigrationInfo,
  closeApiKeysMigrationInfo,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export const ServiceAccountsListPageUnconnected = ({
  serviceAccounts,
  isLoading,
  roleOptions,
  query,
  serviceAccountStateFilter,
  apiKeysMigrated,
  showApiKeysMigrationInfo,
  changeQuery,
  fetchACOptions,
  fetchServiceAccounts,
  deleteServiceAccount,
  updateServiceAccount,
  changeStateFilter,
  createServiceAccountToken,
  getApiKeysMigrationStatus,
  getApiKeysMigrationInfo,
  closeApiKeysMigrationInfo,
}: Props): JSX.Element => {
  const styles = useStyles2(getStyles);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [newToken, setNewToken] = useState('');
  const [currentServiceAccount, setCurrentServiceAccount] = useState<ServiceAccountDTO | null>(null);

  useEffect(() => {
    fetchServiceAccounts({ withLoadingIndicator: true });
    getApiKeysMigrationStatus();
    getApiKeysMigrationInfo();
    if (contextSrv.licensedAccessControlEnabled()) {
      fetchACOptions();
    }
  }, [fetchACOptions, fetchServiceAccounts, getApiKeysMigrationStatus, getApiKeysMigrationInfo]);

  const noServiceAccountsCreated =
    serviceAccounts.length === 0 && serviceAccountStateFilter === ServiceAccountStateFilter.All && !query;

  const onRoleChange = async (role: OrgRole, serviceAccount: ServiceAccountDTO) => {
    const updatedServiceAccount = { ...serviceAccount, role: role };
    updateServiceAccount(updatedServiceAccount);
    if (contextSrv.licensedAccessControlEnabled()) {
      fetchACOptions();
    }
  };

  const onQueryChange = (value: string) => {
    changeQuery(value);
  };

  const onStateFilterChange = (value: ServiceAccountStateFilter) => {
    changeStateFilter(value);
  };

  const onRemoveButtonClick = (serviceAccount: ServiceAccountDTO) => {
    setCurrentServiceAccount(serviceAccount);
    setIsRemoveModalOpen(true);
  };

  const onServiceAccountRemove = async () => {
    if (currentServiceAccount) {
      deleteServiceAccount(currentServiceAccount.id);
    }
    onRemoveModalClose();
  };

  const onDisableButtonClick = (serviceAccount: ServiceAccountDTO) => {
    setCurrentServiceAccount(serviceAccount);
    setIsDisableModalOpen(true);
  };

  const onDisable = () => {
    if (currentServiceAccount) {
      updateServiceAccount({ ...currentServiceAccount, isDisabled: true });
    }
    onDisableModalClose();
  };

  const onEnable = (serviceAccount: ServiceAccountDTO) => {
    updateServiceAccount({ ...serviceAccount, isDisabled: false });
  };

  const onTokenAdd = (serviceAccount: ServiceAccountDTO) => {
    setCurrentServiceAccount(serviceAccount);
    setIsAddModalOpen(true);
  };

  const onTokenCreate = async (token: ServiceAccountToken) => {
    if (currentServiceAccount) {
      createServiceAccountToken(currentServiceAccount.id, token, setNewToken);
    }
  };

  const onAddModalClose = () => {
    setIsAddModalOpen(false);
    setCurrentServiceAccount(null);
    setNewToken('');
  };

  const onRemoveModalClose = () => {
    setIsRemoveModalOpen(false);
    setCurrentServiceAccount(null);
  };

  const onDisableModalClose = () => {
    setIsDisableModalOpen(false);
    setCurrentServiceAccount(null);
  };

  const onMigrationInfoClose = () => {
    closeApiKeysMigrationInfo();
  };

  const docsLink = (
    <a
      className="external-link"
      href="https://grafana.com/docs/grafana/latest/administration/service-accounts/"
      target="_blank"
      rel="noopener noreferrer"
    >
      了解更多
    </a>
  );
  const subTitle = <span>服务帐户及其令牌可用于针对Grafana API进行身份验证 {docsLink}</span>;

  return (
    <Page navId="serviceaccounts" subTitle={subTitle}>
      <Page.Contents>
        {apiKeysMigrated && showApiKeysMigrationInfo && (
          <Alert
            title="API密钥已迁移到服务帐户。您的密钥现在被称为令牌，并驻留在各自的服务帐户中。了解详情"
            severity="success"
            onRemove={onMigrationInfoClose}
          ></Alert>
        )}
        <Page.OldNavOnly>
          <div className={styles.pageHeader}>
            <h2>服务帐户</h2>
            <div className={styles.apiKeyInfoLabel}>
              <Tooltip placement="bottom" interactive content={<>API密钥现在是带有令牌的服务帐户 {docsLink}</>}>
                <Icon name="question-circle" />
              </Tooltip>
              <span>加载API密钥?</span>
            </div>
          </div>
        </Page.OldNavOnly>
        <div className="page-action-bar">
          <div className="gf-form gf-form--grow">
            <FilterInput placeholder="按名称搜索服务帐户" value={query} onChange={onQueryChange} width={50} />
          </div>
          <RadioButtonGroup
            options={[
              { label: '所有', value: ServiceAccountStateFilter.All },
              { label: '过期token', value: ServiceAccountStateFilter.WithExpiredTokens },
              { label: '禁用', value: ServiceAccountStateFilter.Disabled },
            ]}
            onChange={onStateFilterChange}
            value={serviceAccountStateFilter}
            className={styles.filter}
          />
          {!noServiceAccountsCreated && contextSrv.hasPermission(AccessControlAction.ServiceAccountsCreate) && (
            <LinkButton href="org/serviceaccounts/create" variant="primary">
              添加业务帐号
            </LinkButton>
          )}
        </div>
        {isLoading && <PageLoader />}
        {!isLoading && noServiceAccountsCreated && (
          <>
            <EmptyListCTA
              title="您还没有创建任何服务帐户"
              buttonIcon="key-skeleton-alt"
              buttonLink="org/serviceaccounts/create"
              buttonTitle="添加业务帐号"
              buttonDisabled={!contextSrv.hasPermission(AccessControlAction.ServiceAccountsCreate)}
              proTip="请记住，您可以为API访问其他应用程序提供特定的权限"
              proTipLink=""
              proTipLinkTitle=""
              proTipTarget="_blank"
            />
          </>
        )}

        {!isLoading && serviceAccounts.length !== 0 && (
          <>
            <div className={cx(styles.table, 'admin-list-table')}>
              <table className="filter-table filter-table--hover">
                <thead>
                  <tr>
                    <th></th>
                    <th>Account</th>
                    <th>ID</th>
                    <th>Roles</th>
                    <th>Tokens</th>
                    <th style={{ width: '34px' }} />
                  </tr>
                </thead>
                <tbody>
                  {serviceAccounts.map((serviceAccount: ServiceAccountDTO) => (
                    <ServiceAccountListItem
                      serviceAccount={serviceAccount}
                      key={serviceAccount.id}
                      roleOptions={roleOptions}
                      onRoleChange={onRoleChange}
                      onRemoveButtonClick={onRemoveButtonClick}
                      onDisable={onDisableButtonClick}
                      onEnable={onEnable}
                      onAddTokenClick={onTokenAdd}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {currentServiceAccount && (
          <>
            <ConfirmModal
              isOpen={isRemoveModalOpen}
              body={`您确定要删除'${currentServiceAccount.name}'${
                !!currentServiceAccount.tokens
                  ? ` 和 ${currentServiceAccount.tokens} 以及 ${pluralize('token', currentServiceAccount.tokens)}`
                  : ''
              }吗?`}
              confirmText="删除"
              title="删除业务帐号"
              onConfirm={onServiceAccountRemove}
              onDismiss={onRemoveModalClose}
            />
            <ConfirmModal
              isOpen={isDisableModalOpen}
              title="禁用服务帐户"
              body={`你确定要禁用 '${currentServiceAccount.name}'吗?`}
              confirmText="禁用服务帐户"
              onConfirm={onDisable}
              onDismiss={onDisableModalClose}
            />
            <CreateTokenModal
              isOpen={isAddModalOpen}
              token={newToken}
              serviceAccountLogin={currentServiceAccount.login}
              onCreateToken={onTokenCreate}
              onClose={onAddModalClose}
            />
          </>
        )}
      </Page.Contents>
    </Page>
  );
};

export const getStyles = (theme: GrafanaTheme2) => {
  return {
    table: css`
      margin-top: ${theme.spacing(3)};
    `,
    filter: css`
      margin: 0 ${theme.spacing(1)};
    `,
    row: css`
      display: flex;
      align-items: center;
      height: 100% !important;

      a {
        padding: ${theme.spacing(0.5)} 0 !important;
      }
    `,
    unitTooltip: css`
      display: flex;
      flex-direction: column;
    `,
    unitItem: css`
      cursor: pointer;
      padding: ${theme.spacing(0.5)} 0;
      margin-right: ${theme.spacing(1)};
    `,
    disabled: css`
      color: ${theme.colors.text.disabled};
    `,
    link: css`
      color: inherit;
      cursor: pointer;
      text-decoration: underline;
    `,
    pageHeader: css`
      display: flex;
      margin-bottom: ${theme.spacing(2)};
    `,
    apiKeyInfoLabel: css`
      margin-left: ${theme.spacing(1)};
      line-height: 2.2;
      flex-grow: 1;
      color: ${theme.colors.text.secondary};

      span {
        padding: ${theme.spacing(0.5)};
      }
    `,
    filterDelimiter: css`
      flex-grow: 1;
    `,
  };
};

const ServiceAccountsListPage = connector(ServiceAccountsListPageUnconnected);
export default ServiceAccountsListPage;
