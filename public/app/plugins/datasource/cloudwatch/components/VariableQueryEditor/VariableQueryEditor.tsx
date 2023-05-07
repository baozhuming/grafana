import React from 'react';

import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { config } from '@grafana/runtime';
import { InlineField } from '@grafana/ui';

import { Dimensions } from '..';
import { CloudWatchDatasource } from '../../datasource';
import { useDimensionKeys, useMetrics, useNamespaces, useRegions } from '../../hooks';
import { migrateVariableQuery } from '../../migrations/variableQueryMigrations';
import { CloudWatchJsonData, CloudWatchQuery, VariableQuery, VariableQueryType } from '../../types';

import { MultiFilter } from './MultiFilter';
import { VariableQueryField } from './VariableQueryField';
import { VariableTextField } from './VariableTextField';

export type Props = QueryEditorProps<CloudWatchDatasource, CloudWatchQuery, CloudWatchJsonData, VariableQuery>;

const queryTypes: Array<{ value: string; label: string }> = [
  { value: VariableQueryType.Regions, label: 'Regions' },
  { value: VariableQueryType.Namespaces, label: 'Namespaces' },
  { value: VariableQueryType.Metrics, label: 'Metrics' },
  { value: VariableQueryType.DimensionKeys, label: 'Dimension Keys' },
  { value: VariableQueryType.DimensionValues, label: 'Dimension Values' },
  { value: VariableQueryType.EBSVolumeIDs, label: 'EBS Volume IDs' },
  { value: VariableQueryType.EC2InstanceAttributes, label: 'EC2 Instance Attributes' },
  { value: VariableQueryType.ResourceArns, label: 'Resource ARNs' },
  { value: VariableQueryType.Statistics, label: 'Statistics' },
  { value: VariableQueryType.LogGroups, label: 'Log Groups' },
  ...(config.featureToggles.cloudWatchCrossAccountQuerying
    ? [{ value: VariableQueryType.Accounts, label: 'Accounts' }]
    : []),
];

export const VariableQueryEditor = ({ query, datasource, onChange }: Props) => {
  const parsedQuery = migrateVariableQuery(query);

  const { region, namespace, metricName, dimensionKey, dimensionFilters } = parsedQuery;
  const [regions, regionIsLoading] = useRegions(datasource);
  const namespaces = useNamespaces(datasource);
  const metrics = useMetrics(datasource, { region, namespace });
  const dimensionKeys = useDimensionKeys(datasource, { region, namespace, metricName });
  const keysForDimensionFilter = useDimensionKeys(datasource, { region, namespace, metricName, dimensionFilters });

  const onRegionChange = async (region: string) => {
    const validatedQuery = await sanitizeQuery({
      ...parsedQuery,
      region,
    });
    onQueryChange(validatedQuery);
  };

  const onNamespaceChange = async (namespace: string) => {
    const validatedQuery = await sanitizeQuery({
      ...parsedQuery,
      namespace,
    });
    onQueryChange(validatedQuery);
  };

  const onQueryChange = (newQuery: VariableQuery) => {
    onChange({
      ...newQuery,
      refId: 'CloudWatchVariableQueryEditor-VariableQuery',
    });
  };

  // Reset dimensionValue parameters if namespace or region change
  const sanitizeQuery = async (query: VariableQuery) => {
    let { metricName, dimensionKey, dimensionFilters, namespace, region } = query;
    if (metricName) {
      await datasource.api.getMetrics({ namespace, region }).then((result: Array<SelectableValue<string>>) => {
        if (!result.find((metric) => metric.value === metricName)) {
          metricName = '';
        }
      });
    }
    if (dimensionKey) {
      await datasource.api.getDimensionKeys({ namespace, region }).then((result: Array<SelectableValue<string>>) => {
        if (!result.find((key) => key.value === dimensionKey)) {
          dimensionKey = '';
          dimensionFilters = {};
        }
      });
    }
    return { ...query, metricName, dimensionKey, dimensionFilters };
  };

  const hasRegionField = [
    VariableQueryType.Metrics,
    VariableQueryType.DimensionKeys,
    VariableQueryType.DimensionValues,
    VariableQueryType.EBSVolumeIDs,
    VariableQueryType.EC2InstanceAttributes,
    VariableQueryType.ResourceArns,
    VariableQueryType.LogGroups,
    VariableQueryType.Accounts,
  ].includes(parsedQuery.queryType);
  const hasNamespaceField = [
    VariableQueryType.Metrics,
    VariableQueryType.DimensionKeys,
    VariableQueryType.DimensionValues,
  ].includes(parsedQuery.queryType);
  return (
    <>
      <VariableQueryField
        value={parsedQuery.queryType}
        options={queryTypes}
        onChange={(value: VariableQueryType) => onQueryChange({ ...parsedQuery, queryType: value })}
        label="查询类型"
        inputId={`variable-query-type-${query.refId}`}
      />
      {hasRegionField && (
        <VariableQueryField
          value={region}
          options={regions}
          onChange={(value: string) => onRegionChange(value)}
          label="地区"
          isLoading={regionIsLoading}
          inputId={`variable-query-region-${query.refId}`}
        />
      )}
      {hasNamespaceField && (
        <VariableQueryField
          value={namespace}
          options={namespaces}
          onChange={(value: string) => onNamespaceChange(value)}
          label="命名空间"
          inputId={`variable-query-namespace-${query.refId}`}
          allowCustomValue
        />
      )}
      {parsedQuery.queryType === VariableQueryType.DimensionValues && (
        <>
          <VariableQueryField
            value={metricName || null}
            options={metrics}
            onChange={(value: string) => onQueryChange({ ...parsedQuery, metricName: value })}
            label="进制"
            inputId={`variable-query-metric-${query.refId}`}
            allowCustomValue
          />
          <VariableQueryField
            value={dimensionKey || null}
            options={dimensionKeys}
            onChange={(value: string) => onQueryChange({ ...parsedQuery, dimensionKey: value })}
            label="范围"
            inputId={`variable-query-dimension-key-${query.refId}`}
            allowCustomValue
          />
          <InlineField label="范围" labelWidth={20} tooltip="要过滤返回值的范围">
            <Dimensions
              metricStat={{ ...parsedQuery, dimensions: parsedQuery.dimensionFilters }}
              onChange={(dimensions) => {
                onChange({ ...parsedQuery, dimensionFilters: dimensions });
              }}
              dimensionKeys={keysForDimensionFilter}
              disableExpressions={true}
              datasource={datasource}
            />
          </InlineField>
        </>
      )}
      {parsedQuery.queryType === VariableQueryType.EBSVolumeIDs && (
        <VariableTextField
          value={query.instanceID}
          placeholder="i-XXXXXXXXXXXXXXXXX"
          onBlur={(value: string) => onQueryChange({ ...parsedQuery, instanceID: value })}
          label="实例 ID"
        />
      )}
      {parsedQuery.queryType === VariableQueryType.EC2InstanceAttributes && (
        <>
          <VariableTextField
            value={parsedQuery.attributeName}
            onBlur={(value: string) => onQueryChange({ ...parsedQuery, attributeName: value })}
            label="属性名称"
            interactive={true}
            tooltip={
              <>
                {'要查询的属性或标记，标签应该被格式化 "Tags.<name>" '}
                <a
                  href="https://grafana.com/docs/grafana/latest/datasources/aws-cloudwatch/template-queries-cloudwatch/#selecting-attributes"
                  target="_blank"
                  rel="noreferrer"
                >
                  有关更多详细信息，请参阅文档
                </a>
              </>
            }
          />
          <InlineField
            label="过滤器"
            labelWidth={20}
            tooltip={
              <>
                <a
                  href="https://grafana.com/docs/grafana/latest/datasources/aws-cloudwatch/template-queries-cloudwatch/#selecting-attributes"
                  target="_blank"
                  rel="noreferrer"
                >
                  预定义 ec2:DescribeInstances 过滤器/标签
                </a>
                {' 以及要过滤的值，标签应该被格式化 tag:<name>.'}
              </>
            }
          >
            <MultiFilter
              filters={parsedQuery.ec2Filters}
              onChange={(filters) => {
                onChange({ ...parsedQuery, ec2Filters: filters });
              }}
              keyPlaceholder="filter/tag"
            />
          </InlineField>
        </>
      )}
      {parsedQuery.queryType === VariableQueryType.ResourceArns && (
        <>
          <VariableTextField
            value={parsedQuery.resourceType}
            onBlur={(value: string) => onQueryChange({ ...parsedQuery, resourceType: value })}
            label="资源类型"
          />
          <InlineField label="标签" labelWidth={20} tooltip="标记来过滤返回值">
            <MultiFilter
              filters={parsedQuery.tags}
              onChange={(filters) => {
                onChange({ ...parsedQuery, tags: filters });
              }}
              keyPlaceholder="tag"
            />
          </InlineField>
        </>
      )}
      {parsedQuery.queryType === VariableQueryType.LogGroups && (
        <VariableTextField
          value={query.logGroupPrefix ?? ''}
          onBlur={(value: string) => onQueryChange({ ...parsedQuery, logGroupPrefix: value })}
          label="日志组前缀"
        />
      )}
    </>
  );
};
