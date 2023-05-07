import React, { FunctionComponent } from 'react';

export interface Props {
  region: string;
}

export const ThrottlingErrorMessage: FunctionComponent<Props> = ({ region }) => (
  <p>
    请访问&nbsp;
    <a
      target="_blank"
      rel="noreferrer"
      className="text-link"
      href={`https://${region}.console.aws.amazon.com/servicequotas/home?region=${region}#!/services/monitoring/quotas/L-5E141212`}
    >
      AWS服务配额控制台
    </a>
    &nbsp;以请求增加配额，或查看&nbsp;
    <a
      target="_blank"
      rel="noreferrer"
      className="text-link"
      href="https://grafana.com/docs/grafana/latest/datasources/cloudwatch/#service-quotas"
    >
      文档
    </a>
    &nbsp;了解更多
  </p>
);
