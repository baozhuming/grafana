import { css } from '@emotion/css';
import React from 'react';

import { LinkButton, CallToActionCard, Icon, useTheme2 } from '@grafana/ui';
import { contextSrv } from 'app/core/core';
import { AccessControlAction } from 'app/types';

export const NoDataSourceCallToAction = () => {
  const theme = useTheme2();

  const canCreateDataSource =
    contextSrv.hasPermission(AccessControlAction.DataSourcesCreate) &&
    contextSrv.hasPermission(AccessControlAction.DataSourcesWrite);

  const message = '查询器至少需要一个数据源，一旦添加了数据源，就可以在这里查询它';
  const footer = (
    <>
      <Icon name="rocket" />
      <> 提示: 您也可以通过配置文件定义数据源 </>
      <a
        href="http://docs.grafana.org/administration/provisioning/#datasources?utm_source=explore"
        target="_blank"
        rel="noreferrer"
        className="text-link"
      >
        了解更多
      </a>
    </>
  );

  const ctaElement = (
    <LinkButton size="lg" href="datasources/new" icon="database" disabled={!canCreateDataSource}>
      添加数据源
    </LinkButton>
  );

  const cardClassName = css`
    max-width: ${theme.breakpoints.values.lg}px;
    margin-top: ${theme.spacing(2)};
    align-self: center;
  `;

  return (
    <CallToActionCard callToActionElement={ctaElement} className={cardClassName} footer={footer} message={message} />
  );
};
