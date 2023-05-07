import { css } from '@emotion/css';
import { SerializedError } from '@reduxjs/toolkit';
import pluralize from 'pluralize';
import React, { useMemo, ReactElement, useState, FC } from 'react';
import { useLocalStorage } from 'react-use';

import { DataSourceInstanceSettings, GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, Tooltip, useStyles2 } from '@grafana/ui';

import { useUnifiedAlertingSelector } from '../../hooks/useUnifiedAlertingSelector';
import { getRulesDataSources, GRAFANA_RULES_SOURCE_NAME } from '../../utils/datasource';
import { makeDataSourceLink } from '../../utils/misc';
import { isRulerNotSupportedResponse } from '../../utils/rules';

export function RuleListErrors(): ReactElement {
  const [expanded, setExpanded] = useState(false);
  const [closed, setClosed] = useLocalStorage('grafana.unifiedalerting.hideErrors', false);
  const dataSourceConfigRequests = useUnifiedAlertingSelector((state) => state.dataSources);
  const promRuleRequests = useUnifiedAlertingSelector((state) => state.promRules);
  const rulerRuleRequests = useUnifiedAlertingSelector((state) => state.rulerRules);
  const styles = useStyles2(getStyles);

  const errors = useMemo((): JSX.Element[] => {
    const [dataSourceConfigErrors, promRequestErrors, rulerRequestErrors] = [
      dataSourceConfigRequests,
      promRuleRequests,
      rulerRuleRequests,
    ].map((requests) =>
      getRulesDataSources().reduce<Array<{ error: SerializedError; dataSource: DataSourceInstanceSettings }>>(
        (result, dataSource) => {
          const error = requests[dataSource.name]?.error;
          if (requests[dataSource.name] && error && !isRulerNotSupportedResponse(requests[dataSource.name])) {
            return [...result, { dataSource, error }];
          }
          return result;
        },
        []
      )
    );
    const grafanaPromError = promRuleRequests[GRAFANA_RULES_SOURCE_NAME]?.error;
    const grafanaRulerError = rulerRuleRequests[GRAFANA_RULES_SOURCE_NAME]?.error;

    const result: JSX.Element[] = [];

    if (grafanaPromError) {
      result.push(<>加载规则状态失败: {grafanaPromError.message || '未知错误'}</>);
    }
    if (grafanaRulerError) {
      result.push(<>加载规则配置失败: {grafanaRulerError.message || '未知错误'}</>);
    }

    dataSourceConfigErrors.forEach(({ dataSource, error }) => {
      result.push(
        <>
          加载数据源配置失败{' '}
          <a href={makeDataSourceLink(dataSource)} className={styles.dsLink}>
            {dataSource.name}
          </a>
          : {error.message || '未知错误'}
        </>
      );
    });

    promRequestErrors.forEach(({ dataSource, error }) =>
      result.push(
        <>
          加载规则状态失败{' '}
          <a href={makeDataSourceLink(dataSource)} className={styles.dsLink}>
            {dataSource.name}
          </a>
          : {error.message || '未知错误'}
        </>
      )
    );

    rulerRequestErrors.forEach(({ dataSource, error }) =>
      result.push(
        <>
          加载规则配置失败{' '}
          <a href={makeDataSourceLink(dataSource)} className={styles.dsLink}>
            {dataSource.name}
          </a>
          : {error.message || '未知错误'}
        </>
      )
    );

    return result;
  }, [dataSourceConfigRequests, promRuleRequests, rulerRuleRequests, styles.dsLink]);

  return (
    <>
      {!!errors.length && closed && (
        <ErrorSummaryButton count={errors.length} onClick={() => setClosed((closed) => !closed)} />
      )}
      {!!errors.length && !closed && (
        <Alert
          data-testid="cloud-rulessource-errors"
          title="加载规则错误"
          severity="error"
          onRemove={() => setClosed(true)}
        >
          {expanded && errors.map((item, idx) => <div key={idx}>{item}</div>)}
          {!expanded && (
            <>
              <div>{errors[0]}</div>
              {errors.length >= 2 && (
                <Button
                  className={styles.moreButton}
                  fill="text"
                  icon="angle-right"
                  size="sm"
                  onClick={() => setExpanded(true)}
                >
                  {errors.length - 1} more {pluralize('error', errors.length - 1)}
                </Button>
              )}
            </>
          )}
        </Alert>
      )}
    </>
  );
}

interface ErrorSummaryProps {
  count: number;
  onClick: () => void;
}

const ErrorSummaryButton: FC<ErrorSummaryProps> = ({ count, onClick }) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.floatRight}>
      <Tooltip content="Show all errors" placement="bottom">
        <Button fill="text" variant="destructive" icon="exclamation-triangle" onClick={onClick}>
          {count > 1 ? <>{count} errors</> : <>1 error</>}
        </Button>
      </Tooltip>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  moreButton: css`
    padding: 0;
  `,
  floatRight: css`
    display: flex;
    justify-content: flex-end;
  `,
  dsLink: css`
    font-weight: ${theme.typography.fontWeightBold};
  `,
});
