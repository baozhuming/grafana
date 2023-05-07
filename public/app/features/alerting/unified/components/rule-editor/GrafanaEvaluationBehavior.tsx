import { css } from '@emotion/css';
import React, { useState } from 'react';
import { RegisterOptions, useFormContext } from 'react-hook-form';

import { GrafanaTheme2 } from '@grafana/data';
import { Field, InlineLabel, Input, InputControl, useStyles2 } from '@grafana/ui';

import { RuleFormValues } from '../../types/rule-form';
import { checkEvaluationIntervalGlobalLimit } from '../../utils/config';
import { parsePrometheusDuration } from '../../utils/time';
import { CollapseToggle } from '../CollapseToggle';
import { EvaluationIntervalLimitExceeded } from '../InvalidIntervalWarning';

import { GrafanaAlertStatePicker } from './GrafanaAlertStatePicker';
import { RuleEditorSection } from './RuleEditorSection';

export const MIN_TIME_RANGE_STEP_S = 10; // 10 seconds

export const forValidationOptions = (evaluateEvery: string): RegisterOptions => ({
  required: {
    value: true,
    message: 'Required.',
  },
  validate: (value: string) => {
    // parsePrometheusDuration does not allow 0 but does allow 0s
    if (value === '0') {
      return true;
    }

    try {
      const millisFor = parsePrometheusDuration(value);

      // 0 is a special value meaning for equals evaluation interval
      if (millisFor === 0) {
        return true;
      }

      try {
        const millisEvery = parsePrometheusDuration(evaluateEvery);
        return millisFor >= millisEvery
          ? true
          : 'For duration must be greater than or equal to the evaluation interval.';
      } catch (err) {
        // if we fail to parse "every", assume validation is successful, or the error messages
        // will overlap in the UI
        return true;
      }
    } catch (error) {
      return error instanceof Error ? error.message : 'Failed to parse duration';
    }
  },
});

export const evaluateEveryValidationOptions: RegisterOptions = {
  required: {
    value: true,
    message: '必输字段',
  },
  validate: (value: string) => {
    try {
      const duration = parsePrometheusDuration(value);

      if (duration < MIN_TIME_RANGE_STEP_S * 1000) {
        return `不能小于 ${MIN_TIME_RANGE_STEP_S} 秒钟`;
      }

      if (duration % (MIN_TIME_RANGE_STEP_S * 1000) !== 0) {
        return `必须是 ${MIN_TIME_RANGE_STEP_S} 秒钟的倍数`;
      }

      return true;
    } catch (error) {
      return error instanceof Error ? error.message : '解析持续时间失败';
    }
  },
};

export const GrafanaEvaluationBehavior = () => {
  const styles = useStyles2(getStyles);
  const [showErrorHandling, setShowErrorHandling] = useState(false);
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext<RuleFormValues>();

  const { exceedsLimit: exceedsGlobalEvaluationLimit } = checkEvaluationIntervalGlobalLimit(watch('evaluateEvery'));

  const evaluateEveryId = 'eval-every-input';
  const evaluateForId = 'eval-for-input';

  return (
    // TODO remove "and alert condition" for recording rules
    <RuleEditorSection stepNo={2} title="警报评估行为">
      <Field label="评估" description="评估间隔适用于组内的每个规则，它可以覆盖现有警报规则的间隔">
        <div className={styles.flexRow}>
          <InlineLabel htmlFor={evaluateEveryId} width={16} tooltip="多长时间评估一次警报，看看它是否触发">
            评估每一个
          </InlineLabel>
          <Field
            className={styles.inlineField}
            error={errors.evaluateEvery?.message}
            invalid={!!errors.evaluateEvery}
            validationMessageHorizontalOverflow={true}
          >
            <Input id={evaluateEveryId} width={8} {...register('evaluateEvery', evaluateEveryValidationOptions)} />
          </Field>

          <InlineLabel
            htmlFor={evaluateForId}
            width={7}
            tooltip="一旦违反条件，警报将进入待处理状态，如果挂起的时间超过范围值，它将变成一个触发警报"
          >
            至
          </InlineLabel>
          <Field
            className={styles.inlineField}
            error={errors.evaluateFor?.message}
            invalid={!!errors.evaluateFor?.message}
            validationMessageHorizontalOverflow={true}
          >
            <Input
              id={evaluateForId}
              width={8}
              {...register('evaluateFor', forValidationOptions(watch('evaluateEvery')))}
            />
          </Field>
        </div>
      </Field>
      {exceedsGlobalEvaluationLimit && <EvaluationIntervalLimitExceeded />}
      <CollapseToggle
        isCollapsed={!showErrorHandling}
        onToggle={(collapsed) => setShowErrorHandling(!collapsed)}
        text="不配置数据和错误处理"
        className={styles.collapseToggle}
      />
      {showErrorHandling && (
        <>
          <Field htmlFor="no-data-state-input" label="如果没有数据或所有值都为空，则警报状态">
            <InputControl
              render={({ field: { onChange, ref, ...field } }) => (
                <GrafanaAlertStatePicker
                  {...field}
                  inputId="no-data-state-input"
                  width={42}
                  includeNoData={true}
                  includeError={false}
                  onChange={(value) => onChange(value?.value)}
                />
              )}
              name="noDataState"
            />
          </Field>
          <Field htmlFor="exec-err-state-input" label="执行错误或超时时的警报状态">
            <InputControl
              render={({ field: { onChange, ref, ...field } }) => (
                <GrafanaAlertStatePicker
                  {...field}
                  inputId="exec-err-state-input"
                  width={42}
                  includeNoData={false}
                  includeError={true}
                  onChange={(value) => onChange(value?.value)}
                />
              )}
              name="execErrState"
            />
          </Field>
        </>
      )}
    </RuleEditorSection>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  inlineField: css`
    margin-bottom: 0;
  `,
  flexRow: css`
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-start;
  `,
  collapseToggle: css`
    margin: ${theme.spacing(2, 0, 2, -1)};
  `,
  globalLimitValue: css`
    font-weight: ${theme.typography.fontWeightBold};
  `,
});
