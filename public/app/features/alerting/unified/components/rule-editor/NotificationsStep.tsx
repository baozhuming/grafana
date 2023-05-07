import { css } from '@emotion/css';
import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { GrafanaTheme2 } from '@grafana/data';
import { Card, Link, useStyles2, useTheme2 } from '@grafana/ui';

import { RuleFormValues } from '../../types/rule-form';
import { GRAFANA_RULES_SOURCE_NAME } from '../../utils/datasource';

import LabelsField from './LabelsField';
import { RuleEditorSection } from './RuleEditorSection';

export const NotificationsStep = () => {
  const [hideFlowChart, setHideFlowChart] = useState(false);
  const styles = useStyles2(getStyles);
  const theme = useTheme2();

  const { watch } = useFormContext<RuleFormValues>();

  const dataSourceName = watch('dataSourceName') ?? GRAFANA_RULES_SOURCE_NAME;

  return (
    <RuleEditorSection
      stepNo={4}
      title="通知"
      description="Grafana通过为警报分配标签来处理警报通知。这些标签将警报连接到联系人点，并使具有匹配标签的警报实例静音"
    >
      <div>
        <div className={styles.hideButton} onClick={() => setHideFlowChart(!hideFlowChart)}>
          {`${!hideFlowChart ? 'Hide' : 'Show'} 流程图`}
        </div>
      </div>
      <div className={styles.contentWrapper}>
        {!hideFlowChart && (
          <img
            className={styles.flowChart}
            src={`public/img/alerting/notification_policy_${theme.name.toLowerCase()}.svg`}
            alt="通知策略流程图"
          />
        )}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <LabelsField dataSourceName={dataSourceName} />
          <Card className={styles.card}>
            <Card.Heading>主路由-所有警报的默认值</Card.Heading>
            <Card.Description>
              如果没有自定义标签，您的警报将通过根路由路由。要查看和编辑根路由，请转到
              <Link href="/alerting/routes">通知策略</Link>或联系您的管理员，如果您使用非grafana警报管理
            </Card.Description>
          </Card>
        </div>
      </div>
    </RuleEditorSection>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  contentWrapper: css`
    display: flex;
    align-items: center;
  `,
  hideButton: css`
    color: ${theme.colors.text.secondary};
    cursor: pointer;
    margin-bottom: ${theme.spacing(1)};
  `,
  card: css`
    max-width: 500px;
  `,
  flowChart: css`
    margin-right: ${theme.spacing(3)};
  `,
});
