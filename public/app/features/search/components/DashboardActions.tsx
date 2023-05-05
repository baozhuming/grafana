import React, { FC } from 'react';

import { Menu, Dropdown, Button, Icon } from '@grafana/ui';

export interface Props {
  folderId?: number;
  canCreateFolders?: boolean;
  canCreateDashboards?: boolean;
}

export const DashboardActions: FC<Props> = ({ folderId, canCreateFolders = false, canCreateDashboards = false }) => {
  const actionUrl = (type: string) => {
    let url = `dashboard/${type}`;

    if (folderId) {
      url += `?folderId=${folderId}`;
    }

    return url;
  };

  const MenuActions = () => {
    return (
      <Menu>
        {canCreateDashboards && <Menu.Item url={actionUrl('new')} label="添加仪表盘" />}
        {!folderId && canCreateFolders && <Menu.Item url="dashboards/folder/new" label="添加文件夹" />}
        {canCreateDashboards && <Menu.Item url={actionUrl('import')} label="导入仪表盘" />}
      </Menu>
    );
  };

  return (
    <div>
      <Dropdown overlay={MenuActions} placement="bottom-start">
        <Button variant="primary">
          创建
          <Icon name="angle-down" />
        </Button>
      </Dropdown>
    </div>
  );
};
