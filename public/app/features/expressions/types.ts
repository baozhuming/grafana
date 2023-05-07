import { DataQuery, ReducerID, SelectableValue } from '@grafana/data';

import { EvalFunction } from '../alerting/state/alertDef';

export enum ExpressionQueryType {
  math = 'math',
  reduce = 'reduce',
  resample = 'resample',
  classic = 'classic_conditions',
  threshold = 'threshold',
}

export const gelTypes: Array<SelectableValue<ExpressionQueryType>> = [
  {
    value: ExpressionQueryType.math,
    label: '数学公式',
    description: '时间序列或数字数据的自由形式数学公式',
  },
  {
    value: ExpressionQueryType.reduce,
    label: '数量',
    description: '获取从查询或表达式返回的一个或多个时间序列，并将每个序列转换为单个数字',
  },
  {
    value: ExpressionQueryType.resample,
    label: '重新采样',
    description: '更改每个时间序列中的时间戳，使其具有一致的时间间隔',
  },
  {
    value: ExpressionQueryType.classic,
    label: '典型条件',
    description: '获取从查询或表达式返回的一个或多个时间序列，并检查是否有任何序列与条件匹配',
  },
  {
    value: ExpressionQueryType.threshold,
    label: '阈值',
    description: '获取从查询或表达式返回的一个或多个时间序列，并检查是否有任何序列符合阈值条件',
  },
];

export const reducerTypes: Array<SelectableValue<string>> = [
  { value: ReducerID.min, label: '最小值', description: '最小值' },
  { value: ReducerID.max, label: '最大值', description: '最大值' },
  { value: ReducerID.mean, label: '平均值', description: '平均值' },
  { value: ReducerID.sum, label: '总数', description: '所有值的和' },
  { value: ReducerID.count, label: '数量', description: '值的数量' },
  { value: ReducerID.last, label: '最近', description: '最后一个值' },
];

export enum ReducerMode {
  Strict = '', // backend API wants an empty string to support "strict" mode
  ReplaceNonNumbers = 'replaceNN',
  DropNonNumbers = 'dropNN',
}

export const reducerMode: Array<SelectableValue<ReducerMode>> = [
  {
    value: ReducerMode.Strict,
    label: '精确',
    description: '如果序列包含非数值数据，结果可以是NaN',
  },
  {
    value: ReducerMode.DropNonNumbers,
    label: '删除非数字值',
    description: '在运算之前先删除NaN，+/-Inf和null',
  },
  {
    value: ReducerMode.ReplaceNonNumbers,
    label: 'Replace Non-numeric Values',
    description: '将NaN， +/-Inf和null替换为一个常量，然后再运算',
  },
];

export const downsamplingTypes: Array<SelectableValue<string>> = [
  { value: ReducerID.last, label: '最近值', description: '用最后一个值填充' },
  { value: ReducerID.min, label: '最小值', description: '用最小值填充' },
  { value: ReducerID.max, label: '最大值', description: '用最大值填充' },
  { value: ReducerID.mean, label: '平均值', description: '用平均值填充' },
  { value: ReducerID.sum, label: '总和', description: '用所有值的和填充' },
];

export const upsamplingTypes: Array<SelectableValue<string>> = [
  { value: 'pad', label: 'pad', description: '用最后一个已知值填充' },
  { value: 'backfilling', label: 'backfilling', description: '用下一个已知值填充' },
  { value: 'fillna', label: 'fillna', description: '填充NaNs' },
];

export const thresholdFunctions: Array<SelectableValue<EvalFunction>> = [
  { value: EvalFunction.IsAbove, label: '高于' },
  { value: EvalFunction.IsBelow, label: '低于' },
  { value: EvalFunction.IsWithinRange, label: '范围内' },
  { value: EvalFunction.IsOutsideRange, label: '范围外' },
];

/**
 * For now this is a single object to cover all the types.... would likely
 * want to split this up by type as the complexity increases
 */
export interface ExpressionQuery extends DataQuery {
  type: ExpressionQueryType;
  reducer?: string;
  expression?: string;
  window?: string;
  downsampler?: string;
  upsampler?: string;
  conditions?: ClassicCondition[];
  settings?: ExpressionQuerySettings;
}

export interface ExpressionQuerySettings {
  mode?: ReducerMode;
  replaceWithValue?: number;
}

export interface ClassicCondition {
  evaluator: {
    params: number[];
    type: EvalFunction;
  };
  operator?: {
    type: string;
  };
  query: {
    params: string[];
  };
  reducer: {
    params: [];
    type: ReducerType;
  };
  type: 'query';
}

export type ReducerType =
  | 'avg'
  | 'min'
  | 'max'
  | 'sum'
  | 'count'
  | 'last'
  | 'median'
  | 'diff'
  | 'diff_abs'
  | 'percent_diff'
  | 'percent_diff_abs'
  | 'count_non_null';
