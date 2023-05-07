import React from 'react';

import { NavModelItem } from '@grafana/data';
import { Page } from 'app/core/components/Page/Page';

import { NewDataSource } from '../components/NewDataSource';
import { DATASOURCES_ROUTES } from '../constants';

export function NewDataSourcePage() {
  const pageNav: NavModelItem = {
    icon: 'database',
    id: 'datasource-new',
    text: '添加数据源',
    url: DATASOURCES_ROUTES.New,
    subTitle: '选择一个数据源类型',
  };

  return (
    <Page navId="datasources" pageNav={pageNav}>
      <Page.Contents>
        <NewDataSource />
      </Page.Contents>
    </Page>
  );
}

export default NewDataSourcePage;
