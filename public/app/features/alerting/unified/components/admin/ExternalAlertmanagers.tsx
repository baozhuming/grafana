import { css } from '@emotion/css';
import React, { useEffect } from 'react';

import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Alert, Field, RadioButtonGroup, useStyles2 } from '@grafana/ui';
import { loadDataSources } from 'app/features/datasources/state/actions';
import { AlertmanagerChoice } from 'app/plugins/datasource/alertmanager/types';
import { useDispatch } from 'app/types';

import { alertmanagerApi } from '../../api/alertmanagerApi';
import { useExternalDataSourceAlertmanagers } from '../../hooks/useExternalAmSelector';

import { ExternalAlertmanagerDataSources } from './ExternalAlertmanagerDataSources';

const alertmanagerChoices: Array<SelectableValue<AlertmanagerChoice>> = [
  { value: AlertmanagerChoice.Internal, label: '只有内部' },
  { value: AlertmanagerChoice.External, label: '只有外部' },
  { value: AlertmanagerChoice.All, label: '内部和外部' },
];

export const ExternalAlertmanagers = () => {
  const styles = useStyles2(getStyles);
  const dispatch = useDispatch();

  const externalDsAlertManagers = useExternalDataSourceAlertmanagers();

  const {
    useSaveExternalAlertmanagersConfigMutation,
    useGetExternalAlertmanagerConfigQuery,
    useGetExternalAlertmanagersQuery,
  } = alertmanagerApi;

  const [saveExternalAlertManagers] = useSaveExternalAlertmanagersConfigMutation();
  const { currentData: externalAlertmanagerConfig } = useGetExternalAlertmanagerConfigQuery();

  // Just to refresh the status periodically
  useGetExternalAlertmanagersQuery(undefined, { pollingInterval: 5000 });

  const alertmanagersChoice = externalAlertmanagerConfig?.alertmanagersChoice;

  useEffect(() => {
    dispatch(loadDataSources());
  }, [dispatch]);

  const onChangeAlertmanagerChoice = (alertmanagersChoice: AlertmanagerChoice) => {
    saveExternalAlertManagers({ alertmanagersChoice });
  };

  return (
    <div>
      <h4>外部警报器</h4>
      <Alert title="警报器变更" severity="info">
        配置外部警报器的方式已经改变
        <br />
        现在，您可以使用配置的警报器数据源作为系统中管理的警报的接收器
        <br />
        有关更多信息，请参阅文档
      </Alert>

      <div className={styles.amChoice}>
        <Field
          label="发送警报至"
          description="配置警报规则评估引擎处理警报的方式。内部(系统内置的警报器)，外部(下面配置的所有警报器)，或两者兼而有之"
        >
          <RadioButtonGroup
            options={alertmanagerChoices}
            value={alertmanagersChoice}
            onChange={(value) => onChangeAlertmanagerChoice(value!)}
          />
        </Field>
      </div>

      <ExternalAlertmanagerDataSources
        alertmanagers={externalDsAlertManagers}
        inactive={alertmanagersChoice === AlertmanagerChoice.Internal}
      />
    </div>
  );
};

export const getStyles = (theme: GrafanaTheme2) => ({
  url: css`
    margin-right: ${theme.spacing(1)};
  `,
  actions: css`
    margin-top: ${theme.spacing(2)};
    display: flex;
    justify-content: flex-end;
  `,
  table: css`
    margin-bottom: ${theme.spacing(2)};
  `,
  amChoice: css`
    margin-bottom: ${theme.spacing(4)};
  `,
});
