import React, { useState } from 'react';

import { NavModelItem } from '@grafana/data';
import { getBackendSrv, locationService } from '@grafana/runtime';
import { Button, Form, Field, Input, FieldSet } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { TeamRolePicker } from 'app/core/components/RolePicker/TeamRolePicker';
import { updateTeamRoles } from 'app/core/components/RolePicker/api';
import { useRoleOptions } from 'app/core/components/RolePicker/hooks';
import { contextSrv } from 'app/core/core';
import { AccessControlAction, Role } from 'app/types';

interface TeamDTO {
  email: string;
  name: string;
}

const pageNav: NavModelItem = {
  icon: 'users-alt',
  id: 'team-new',
  text: '新建团队',
  subTitle: '创建一个新团队，团队允许您向一组用户授予权限',
  breadcrumbs: [{ title: '配置', url: 'org/teams' }],
};

export const CreateTeam = (): JSX.Element => {
  const currentOrgId = contextSrv.user.orgId;
  const [pendingRoles, setPendingRoles] = useState<Role[]>([]);
  const [{ roleOptions }] = useRoleOptions(currentOrgId);

  const canUpdateRoles =
    contextSrv.hasPermission(AccessControlAction.ActionUserRolesAdd) &&
    contextSrv.hasPermission(AccessControlAction.ActionUserRolesRemove);

  const createTeam = async (formModel: TeamDTO) => {
    const newTeam = await getBackendSrv().post('/api/teams', formModel);
    if (newTeam.teamId) {
      try {
        await contextSrv.fetchUserPermissions();
        if (contextSrv.licensedAccessControlEnabled() && canUpdateRoles) {
          await updateTeamRoles(pendingRoles, newTeam.teamId, newTeam.orgId);
        }
      } catch (e) {
        console.error(e);
      }
      locationService.push(`/org/teams/edit/${newTeam.teamId}`);
    }
  };

  return (
    <Page navId="teams" pageNav={pageNav}>
      <Page.Contents>
        <Form onSubmit={createTeam}>
          {({ register, errors }) => (
            <FieldSet>
              <Field label="名称" required invalid={!!errors.name} error="请输入团队名称">
                <Input {...register('name', { required: true })} id="team-name" />
              </Field>
              {contextSrv.licensedAccessControlEnabled() && (
                <Field label="角色">
                  <TeamRolePicker
                    teamId={0}
                    roleOptions={roleOptions}
                    disabled={false}
                    apply={true}
                    onApplyRoles={setPendingRoles}
                    pendingRoles={pendingRoles}
                    maxWidth="100%"
                  />
                </Field>
              )}
              <Field label={'邮件'} description={'这是可选的，主要用于允许自定义团队头像'}>
                <Input {...register('email')} type="email" id="team-email" placeholder="email@test.com" />
              </Field>
              <div className="gf-form-button-row">
                <Button type="submit" variant="primary">
                  创建
                </Button>
              </div>
            </FieldSet>
          )}
        </Form>
      </Page.Contents>
    </Page>
  );
};

export default CreateTeam;
