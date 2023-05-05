import React from 'react';

import {
  FieldConfigEditorBuilder,
  FieldType,
  identityOverrideProcessor,
  SelectableValue,
  StandardEditorProps,
} from '@grafana/data';
import { AxisColorMode, AxisConfig, AxisPlacement, ScaleDistribution, ScaleDistributionConfig } from '@grafana/schema';

import { graphFieldOptions, Select, RadioButtonGroup, Input, Field } from '../../index';

/**
 * @alpha
 */
export function addAxisConfig(
  builder: FieldConfigEditorBuilder<AxisConfig>,
  defaultConfig: AxisConfig,
  hideScale?: boolean
) {
  const category = ['Axis'];

  // options for axis appearance
  builder
    .addRadio({
      path: 'axisPlacement',
      name: '摆放',
      category,
      defaultValue: graphFieldOptions.axisPlacement[0].value,
      settings: {
        options: graphFieldOptions.axisPlacement,
      },
    })
    .addTextInput({
      path: 'axisLabel',
      name: '标签',
      category,
      defaultValue: '',
      settings: {
        placeholder: '可选的文本',
      },
      showIf: (c) => c.axisPlacement !== AxisPlacement.Hidden,
      // Do not apply default settings to time and string fields which are used as x-axis fields in Time series and Bar chart panels
      shouldApply: (f) => f.type !== FieldType.time && f.type !== FieldType.string,
    })
    .addNumberInput({
      path: 'axisWidth',
      name: '宽',
      category,
      settings: {
        placeholder: 'Auto',
      },
      showIf: (c) => c.axisPlacement !== AxisPlacement.Hidden,
    })
    .addRadio({
      path: 'axisGridShow',
      name: '显示网格线',
      category,
      defaultValue: undefined,
      settings: {
        options: [
          { value: undefined, label: '自动' },
          { value: true, label: '打开' },
          { value: false, label: '关闭' },
        ],
      },
    })
    .addRadio({
      path: 'axisColorMode',
      name: '颜色',
      category,
      defaultValue: AxisColorMode.Text,
      settings: {
        options: [
          { value: AxisColorMode.Text, label: '文本' },
          { value: AxisColorMode.Series, label: '元素' },
        ],
      },
    });

  // options for scale range
  builder
    .addCustomEditor<void, ScaleDistributionConfig>({
      id: 'scaleDistribution',
      path: 'scaleDistribution',
      name: '刻度',
      category,
      editor: ScaleDistributionEditor as any,
      override: ScaleDistributionEditor as any,
      defaultValue: { type: ScaleDistribution.Linear },
      shouldApply: (f) => f.type === FieldType.number,
      process: identityOverrideProcessor,
    })
    .addBooleanSwitch({
      path: 'axisCenteredZero',
      name: '以零为标线',
      category,
      defaultValue: false,
      showIf: (c) => c.scaleDistribution?.type !== ScaleDistribution.Log,
    })
    .addNumberInput({
      path: 'axisSoftMin',
      name: '软最小值',
      defaultValue: defaultConfig.axisSoftMin,
      category,
      settings: {
        placeholder: '参见:标准选项> Min',
      },
    })
    .addNumberInput({
      path: 'axisSoftMax',
      name: '软最大值',
      defaultValue: defaultConfig.axisSoftMax,
      category,
      settings: {
        placeholder: '参见:标准选项> Max',
      },
    });
}

const DISTRIBUTION_OPTIONS: Array<SelectableValue<ScaleDistribution>> = [
  {
    label: '线性',
    value: ScaleDistribution.Linear,
  },
  {
    label: '对数曲线',
    value: ScaleDistribution.Log,
  },
  {
    label: 'Symlog',
    value: ScaleDistribution.Symlog,
  },
];

const LOG_DISTRIBUTION_OPTIONS: Array<SelectableValue<number>> = [
  {
    label: '2',
    value: 2,
  },
  {
    label: '10',
    value: 10,
  },
];

/**
 * @internal
 */
export const ScaleDistributionEditor = ({ value, onChange }: StandardEditorProps<ScaleDistributionConfig>) => {
  const type = value?.type ?? ScaleDistribution.Linear;
  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <RadioButtonGroup
          value={type}
          options={DISTRIBUTION_OPTIONS}
          onChange={(v) => {
            onChange({
              ...value,
              type: v!,
              log: v === ScaleDistribution.Linear ? undefined : value.log ?? 2,
            });
          }}
        />
      </div>
      {(type === ScaleDistribution.Log || type === ScaleDistribution.Symlog) && (
        <Field label="Log底数">
          <Select
            options={LOG_DISTRIBUTION_OPTIONS}
            value={value.log ?? 2}
            onChange={(v) => {
              onChange({
                ...value,
                log: v.value!,
              });
            }}
          />
        </Field>
      )}
      {type === ScaleDistribution.Symlog && (
        <Field label="线性阈值">
          <Input
            placeholder="1"
            value={value.linearThreshold}
            onChange={(v) => {
              onChange({
                ...value,
                linearThreshold: Number(v.currentTarget.value),
              });
            }}
          />
        </Field>
      )}
    </>
  );
};
