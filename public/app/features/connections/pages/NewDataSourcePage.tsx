import * as React from 'react';

import { Page } from 'app/core/components/Page/Page';
import { NewDataSource } from 'app/features/datasources/components/NewDataSource';

export function NewDataSourcePage() {
  return (
    <Page
      navId={'connections-your-connections-datasources'}
      pageNav={{ text: '添加数据源', subTitle: '选择一个数据源类型', active: true }}
    >
      <Page.Contents>
        <NewDataSource />
      </Page.Contents>
    </Page>
  );
}
