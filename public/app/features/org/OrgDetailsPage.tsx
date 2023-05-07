import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import { NavModel } from '@grafana/data';
import { VerticalGroup } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import SharedPreferences from 'app/core/components/SharedPreferences/SharedPreferences';
import { appEvents, contextSrv } from 'app/core/core';
import { getNavModel } from 'app/core/selectors/navModel';
import { AccessControlAction, Organization, StoreState } from 'app/types';
import { ShowConfirmModalEvent } from 'app/types/events';

import OrgProfile from './OrgProfile';
import { loadOrganization, updateOrganization } from './state/actions';
import { setOrganizationName } from './state/reducers';

export interface Props {
  navModel: NavModel;
  organization: Organization;
  loadOrganization: typeof loadOrganization;
  setOrganizationName: typeof setOrganizationName;
  updateOrganization: typeof updateOrganization;
}

export class OrgDetailsPage extends PureComponent<Props> {
  async componentDidMount() {
    await this.props.loadOrganization();
  }

  onUpdateOrganization = (orgName: string) => {
    this.props.setOrganizationName(orgName);
    this.props.updateOrganization();
  };

  handleConfirm = () => {
    return new Promise<boolean>((resolve) => {
      appEvents.publish(
        new ShowConfirmModalEvent({
          title: '确认更新首选项',
          text: '这将更新整个机构的首选项，您确定要更新首选项吗?',
          yesText: '保存',
          yesButtonVariant: 'primary',
          onConfirm: async () => resolve(true),
          onDismiss: async () => resolve(false),
        })
      );
    });
  };

  render() {
    const { navModel, organization } = this.props;
    const isLoading = Object.keys(organization).length === 0;
    const canReadOrg = contextSrv.hasPermission(AccessControlAction.OrgsRead);
    const canReadPreferences = contextSrv.hasPermission(AccessControlAction.OrgsPreferencesRead);
    const canWritePreferences = contextSrv.hasPermission(AccessControlAction.OrgsPreferencesWrite);

    return (
      <Page navModel={navModel}>
        <Page.Contents isLoading={isLoading}>
          {!isLoading && (
            <VerticalGroup spacing="lg">
              {canReadOrg && <OrgProfile onSubmit={this.onUpdateOrganization} orgName={organization.name} />}
              {canReadPreferences && (
                <SharedPreferences resourceUri="org" disabled={!canWritePreferences} onConfirm={this.handleConfirm} />
              )}
            </VerticalGroup>
          )}
        </Page.Contents>
      </Page>
    );
  }
}

function mapStateToProps(state: StoreState) {
  return {
    navModel: getNavModel(state.navIndex, 'org-settings'),
    organization: state.organization.organization,
  };
}

const mapDispatchToProps = {
  loadOrganization,
  setOrganizationName,
  updateOrganization,
};

export default connect(mapStateToProps, mapDispatchToProps)(OrgDetailsPage);
