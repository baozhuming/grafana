import React, { FC } from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { NavModelItem } from '@grafana/data';
import { Button, Input, Field, Form, FieldSet } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { getConfig } from 'app/core/config';

import { createOrganization } from './state/actions';

const mapDispatchToProps = {
  createOrganization,
};

const connector = connect(undefined, mapDispatchToProps);

type Props = ConnectedProps<typeof connector>;

interface CreateOrgFormDTO {
  name: string;
}

const pageNav: NavModelItem = {
  icon: 'building',
  id: 'org-new',
  text: '新建机构',
  breadcrumbs: [{ title: '服务器管理员', url: 'admin/orgs' }],
};

export const NewOrgPage: FC<Props> = ({ createOrganization }) => {
  const createOrg = async (newOrg: { name: string }) => {
    await createOrganization(newOrg);
    window.location.href = getConfig().appSubUrl + '/org';
  };

  return (
    <Page navId="global-orgs" pageNav={pageNav}>
      <Page.Contents>
        <p className="muted">
          每个机构都包含自己的仪表盘、数据源和配置，这些信息不能在机构之间共享,虽然用户可能属于多个机构,但在多租户部署中最常使用多个机构
        </p>

        <Form<CreateOrgFormDTO> onSubmit={createOrg}>
          {({ register, errors }) => {
            return (
              <>
                <FieldSet>
                  <Field label="机构名称" invalid={!!errors.name} error={errors.name && errors.name.message}>
                    <Input
                      placeholder="机构名称"
                      {...register('name', {
                        required: '请输入机构名称',
                      })}
                    />
                  </Field>
                </FieldSet>
                <Button type="submit">创建</Button>
              </>
            );
          }}
        </Form>
      </Page.Contents>
    </Page>
  );
};

export default connector(NewOrgPage);
