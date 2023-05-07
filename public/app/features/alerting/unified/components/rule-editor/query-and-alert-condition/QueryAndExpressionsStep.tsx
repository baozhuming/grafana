import React, { FC, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { LoadingState, PanelData } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { Stack } from '@grafana/experimental';
import { config } from '@grafana/runtime';
import { Alert, Button, Field, InputControl, Tooltip } from '@grafana/ui';
import { isExpressionQuery } from 'app/features/expressions/guards';
import { AlertQuery } from 'app/types/unified-alerting-dto';

import { AlertingQueryRunner } from '../../../state/AlertingQueryRunner';
import { RuleFormType, RuleFormValues } from '../../../types/rule-form';
import { getDefaultOrFirstCompatibleDataSource } from '../../../utils/datasource';
import { ExpressionEditor } from '../ExpressionEditor';
import { ExpressionsEditor } from '../ExpressionsEditor';
import { QueryEditor } from '../QueryEditor';
import { RuleEditorSection } from '../RuleEditorSection';
import { refIdExists } from '../util';

import { AlertType } from './AlertType';
import {
  duplicateQuery,
  addNewDataQuery,
  addNewExpression,
  queriesAndExpressionsReducer,
  removeExpression,
  rewireExpressions,
  setDataQueries,
  updateExpression,
  updateExpressionRefId,
  updateExpressionType,
  updateExpressionTimeRange,
} from './reducer';

interface Props {
  editingExistingRule: boolean;
}

export const QueryAndExpressionsStep: FC<Props> = ({ editingExistingRule }) => {
  const runner = useRef(new AlertingQueryRunner());
  const {
    setValue,
    getValues,
    watch,
    formState: { errors },
    control,
  } = useFormContext<RuleFormValues>();
  const [panelData, setPanelData] = useState<Record<string, PanelData>>({});

  const initialState = {
    queries: getValues('queries'),
    panelData: {},
  };
  const [{ queries }, dispatch] = useReducer(queriesAndExpressionsReducer, initialState);

  const [type, condition, dataSourceName] = watch(['type', 'condition', 'dataSourceName']);

  const isGrafanaManagedType = type === RuleFormType.grafana;
  const isCloudAlertRuleType = type === RuleFormType.cloudAlerting;
  const isRecordingRuleType = type === RuleFormType.cloudRecording;

  const showCloudExpressionEditor = (isRecordingRuleType || isCloudAlertRuleType) && dataSourceName;

  const cancelQueries = useCallback(() => {
    runner.current.cancel();
  }, []);

  const runQueries = useCallback(() => {
    runner.current.run(getValues('queries'));
  }, [getValues]);

  // whenever we update the queries we have to update the form too
  useEffect(() => {
    setValue('queries', queries, { shouldValidate: false });
  }, [queries, runQueries, setValue]);

  // set up the AlertQueryRunner
  useEffect(() => {
    const currentRunner = runner.current;

    runner.current.get().subscribe((data) => {
      setPanelData(data);
    });

    return () => currentRunner.destroy();
  }, []);

  const noCompatibleDataSources = getDefaultOrFirstCompatibleDataSource() === undefined;

  const isDataLoading = useMemo(() => {
    return Object.values(panelData).some((d) => d.state === LoadingState.Loading);
  }, [panelData]);

  // data queries only
  const dataQueries = useMemo(() => {
    return queries.filter((query) => !isExpressionQuery(query.model));
  }, [queries]);

  // expression queries only
  const expressionQueries = useMemo(() => {
    return queries.filter((query) => isExpressionQuery(query.model));
  }, [queries]);

  const emptyQueries = queries.length === 0;

  const onUpdateRefId = useCallback(
    (oldRefId: string, newRefId: string) => {
      const newRefIdExists = refIdExists(queries, newRefId);
      // TODO we should set an error and explain what went wrong instead of just refusing to update
      if (newRefIdExists) {
        return;
      }

      dispatch(updateExpressionRefId({ oldRefId, newRefId }));

      // update condition too if refId was updated
      if (condition === oldRefId) {
        setValue('condition', newRefId);
      }
    },
    [condition, queries, setValue]
  );

  const onChangeQueries = useCallback(
    (updatedQueries: AlertQuery[]) => {
      dispatch(setDataQueries(updatedQueries));
      dispatch(updateExpressionTimeRange());
      // check if we need to rewire expressions
      updatedQueries.forEach((query, index) => {
        const oldRefId = queries[index].refId;
        const newRefId = query.refId;

        if (oldRefId !== newRefId) {
          dispatch(rewireExpressions({ oldRefId, newRefId }));
        }
      });
    },
    [queries]
  );

  const onDuplicateQuery = useCallback((query: AlertQuery) => {
    dispatch(duplicateQuery(query));
  }, []);

  // update the condition if it's been removed
  useEffect(() => {
    if (!refIdExists(queries, condition)) {
      const lastRefId = queries.at(-1)?.refId ?? null;
      setValue('condition', lastRefId);
    }
  }, [condition, queries, setValue]);

  return (
    <RuleEditorSection stepNo={1} title="设置查询和警报条件">
      <AlertType editingExistingRule={editingExistingRule} />

      {/* This is the PromQL Editor for Cloud rules and recording rules */}
      {showCloudExpressionEditor && (
        <Field error={errors.expression?.message} invalid={!!errors.expression?.message}>
          <InputControl
            name="expression"
            render={({ field: { ref, ...field } }) => {
              return <ExpressionEditor {...field} dataSourceName={dataSourceName} />;
            }}
            control={control}
            rules={{
              required: { value: true, message: '请输入有效的表达式' },
            }}
          />
        </Field>
      )}

      {/* This is the editor for Grafana managed rules */}
      {isGrafanaManagedType && (
        <Stack direction="column">
          {/* Data Queries */}
          <QueryEditor
            queries={dataQueries}
            expressions={expressionQueries}
            onRunQueries={runQueries}
            onChangeQueries={onChangeQueries}
            onDuplicateQuery={onDuplicateQuery}
            panelData={panelData}
            condition={condition}
            onSetCondition={(refId) => {
              setValue('condition', refId);
            }}
          />
          {/* Expression Queries */}
          <ExpressionsEditor
            queries={queries}
            panelData={panelData}
            condition={condition}
            onSetCondition={(refId) => {
              setValue('condition', refId);
            }}
            onRemoveExpression={(refId) => {
              dispatch(removeExpression(refId));
            }}
            onUpdateRefId={onUpdateRefId}
            onUpdateExpressionType={(refId, type) => {
              dispatch(updateExpressionType({ refId, type }));
            }}
            onUpdateQueryExpression={(model) => {
              dispatch(updateExpression(model));
            }}
          />
          {/* action buttons */}
          <Stack direction="row">
            <Tooltip content={'您似乎没有兼容的数据源'} show={noCompatibleDataSources}>
              <Button
                type="button"
                icon="plus"
                onClick={() => {
                  dispatch(addNewDataQuery());
                }}
                variant="secondary"
                aria-label={selectors.components.QueryTab.addQuery}
                disabled={noCompatibleDataSources}
              >
                添加查询
              </Button>
            </Tooltip>

            {config.expressionsEnabled && (
              <Button
                type="button"
                icon="plus"
                onClick={() => {
                  dispatch(addNewExpression());
                }}
                variant="secondary"
              >
                添加表达式
              </Button>
            )}

            {isDataLoading && (
              <Button icon="fa fa-spinner" type="button" variant="destructive" onClick={cancelQueries}>
                取消
              </Button>
            )}
            {!isDataLoading && (
              <Button icon="sync" type="button" onClick={() => runQueries()} disabled={emptyQueries}>
                预览
              </Button>
            )}
          </Stack>

          {/* No Queries */}
          {emptyQueries && (
            <Alert title="没有配置任何查询或表达式" severity="warning">
              创建至少一个要发出警报的查询或表达式
            </Alert>
          )}
        </Stack>
      )}
    </RuleEditorSection>
  );
};
