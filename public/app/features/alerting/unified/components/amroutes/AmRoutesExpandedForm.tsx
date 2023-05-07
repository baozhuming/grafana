import { css, cx } from '@emotion/css';
import React, { FC, useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import {
  Button,
  Field,
  FieldArray,
  Form,
  HorizontalGroup,
  IconButton,
  Input,
  InputControl,
  MultiSelect,
  Select,
  Switch,
  useStyles2,
  Badge,
  VerticalGroup,
} from '@grafana/ui';

import { useMuteTimingOptions } from '../../hooks/useMuteTimingOptions';
import { AmRouteReceiver, FormAmRoute } from '../../types/amroutes';
import { matcherFieldOptions } from '../../utils/alertmanager';
import {
  emptyArrayFieldMatcher,
  mapMultiSelectValueToStrings,
  mapSelectValueToString,
  optionalPositiveInteger,
  stringToSelectableValue,
  stringsToSelectableValues,
  commonGroupByOptions,
} from '../../utils/amroutes';
import { timeOptions } from '../../utils/time';

import { getFormStyles } from './formStyles';

export interface AmRoutesExpandedFormProps {
  onCancel: () => void;
  onSave: (data: FormAmRoute) => void;
  receivers: AmRouteReceiver[];
  routes: FormAmRoute;
}

export const AmRoutesExpandedForm: FC<AmRoutesExpandedFormProps> = ({ onCancel, onSave, receivers, routes }) => {
  const styles = useStyles2(getStyles);
  const formStyles = useStyles2(getFormStyles);
  const [groupByOptions, setGroupByOptions] = useState(stringsToSelectableValues(routes.groupBy));
  const muteTimingOptions = useMuteTimingOptions();

  return (
    <Form defaultValues={routes} onSubmit={onSave}>
      {({ control, register, errors, setValue, watch }) => (
        <>
          {/* @ts-ignore-check: react-hook-form made me do this */}
          <input type="hidden" {...register('id')} />
          {/* @ts-ignore-check: react-hook-form made me do this */}
          <FieldArray name="object_matchers" control={control}>
            {({ fields, append, remove }) => (
              <>
                <VerticalGroup justify="flex-start" spacing="md">
                  <div>匹配的标签</div>
                  {fields.length === 0 && (
                    <Badge
                      color="orange"
                      className={styles.noMatchersWarning}
                      icon="exclamation-triangle"
                      text="如果没有指定匹配器，则此通知策略将处理所有警报实例"
                    />
                  )}
                  {fields.length > 0 && (
                    <div className={styles.matchersContainer}>
                      {fields.map((field, index) => {
                        const localPath = `object_matchers[${index}]`;
                        return (
                          <HorizontalGroup key={field.id} align="flex-start" height="auto">
                            <Field
                              label="标签"
                              invalid={!!errors.object_matchers?.[index]?.name}
                              error={errors.object_matchers?.[index]?.name?.message}
                            >
                              <Input
                                {...register(`${localPath}.name`, { required: '请输入标签' })}
                                defaultValue={field.name}
                                placeholder="标签"
                              />
                            </Field>
                            <Field label={'操作符'}>
                              <InputControl
                                render={({ field: { onChange, ref, ...field } }) => (
                                  <Select
                                    {...field}
                                    className={styles.matchersOperator}
                                    onChange={(value) => onChange(value?.value)}
                                    options={matcherFieldOptions}
                                    aria-label="操作符"
                                  />
                                )}
                                defaultValue={field.operator}
                                control={control}
                                name={`${localPath}.operator` as const}
                                rules={{ required: { value: true, message: '请输入操作符' } }}
                              />
                            </Field>
                            <Field
                              label="值"
                              invalid={!!errors.object_matchers?.[index]?.value}
                              error={errors.object_matchers?.[index]?.value?.message}
                            >
                              <Input
                                {...register(`${localPath}.value`, { required: 'Field is required' })}
                                defaultValue={field.value}
                                placeholder="值"
                              />
                            </Field>
                            <IconButton
                              className={styles.removeButton}
                              tooltip="删除匹配器"
                              name={'trash-alt'}
                              onClick={() => remove(index)}
                            >
                              删除
                            </IconButton>
                          </HorizontalGroup>
                        );
                      })}
                    </div>
                  )}
                  <Button
                    className={styles.addMatcherBtn}
                    icon="plus"
                    onClick={() => append(emptyArrayFieldMatcher)}
                    variant="secondary"
                    type="button"
                  >
                    添加匹配器
                  </Button>
                </VerticalGroup>
              </>
            )}
          </FieldArray>
          <Field label="连接点">
            {/* @ts-ignore-check: react-hook-form made me do this */}
            <InputControl
              render={({ field: { onChange, ref, ...field } }) => (
                <Select
                  aria-label="连接点"
                  {...field}
                  className={formStyles.input}
                  onChange={(value) => onChange(mapSelectValueToString(value))}
                  options={receivers}
                />
              )}
              control={control}
              name="receiver"
            />
          </Field>
          <Field label="继续匹配后续兄弟节点">
            <Switch id="continue-toggle" {...register('continue')} />
          </Field>
          <Field label="覆盖分组">
            <Switch id="override-grouping-toggle" {...register('overrideGrouping')} />
          </Field>
          {watch().overrideGrouping && (
            <Field label="分组" description="当您收到基于标签的通知时，将警报分组。如果为空，将从父策略继承">
              <InputControl
                render={({ field: { onChange, ref, ...field } }) => (
                  <MultiSelect
                    aria-label="分组"
                    {...field}
                    allowCustomValue
                    className={formStyles.input}
                    onCreateOption={(opt: string) => {
                      setGroupByOptions((opts) => [...opts, stringToSelectableValue(opt)]);

                      // @ts-ignore-check: react-hook-form made me do this
                      setValue('groupBy', [...field.value, opt]);
                    }}
                    onChange={(value) => onChange(mapMultiSelectValueToStrings(value))}
                    options={[...commonGroupByOptions, ...groupByOptions]}
                  />
                )}
                control={control}
                name="groupBy"
              />
            </Field>
          )}
          <Field label="超常计时">
            <Switch id="override-timings-toggle" {...register('overrideTimings')} />
          </Field>
          {watch().overrideTimings && (
            <>
              <Field
                label="分组等待时间"
                description="为传入警报创建的新组发送初始通知之前的等待时间。如果为空，将从父策略继承"
                invalid={!!errors.groupWaitValue}
                error={errors.groupWaitValue?.message}
              >
                <>
                  <div className={cx(formStyles.container, formStyles.timingContainer)}>
                    <InputControl
                      render={({ field, fieldState: { invalid } }) => (
                        <Input
                          {...field}
                          className={formStyles.smallInput}
                          invalid={invalid}
                          aria-label="分组等待时间的值"
                        />
                      )}
                      control={control}
                      name="groupWaitValue"
                      rules={{
                        validate: optionalPositiveInteger,
                      }}
                    />
                    <InputControl
                      render={({ field: { onChange, ref, ...field } }) => (
                        <Select
                          {...field}
                          className={formStyles.input}
                          onChange={(value) => onChange(mapSelectValueToString(value))}
                          options={timeOptions}
                          aria-label="分组等待类型"
                        />
                      )}
                      control={control}
                      name="groupWaitValueType"
                    />
                  </div>
                </>
              </Field>
              <Field
                label="分组通知间隔时间"
                description="发送第一个通知后为该组发送一批新警报的等待时间。如果为空，将从父策略继承"
                invalid={!!errors.groupIntervalValue}
                error={errors.groupIntervalValue?.message}
              >
                <>
                  <div className={cx(formStyles.container, formStyles.timingContainer)}>
                    <InputControl
                      render={({ field, fieldState: { invalid } }) => (
                        <Input
                          {...field}
                          className={formStyles.smallInput}
                          invalid={invalid}
                          aria-label="分组通知间隔时间的值"
                        />
                      )}
                      control={control}
                      name="groupIntervalValue"
                      rules={{
                        validate: optionalPositiveInteger,
                      }}
                    />
                    <InputControl
                      render={({ field: { onChange, ref, ...field } }) => (
                        <Select
                          {...field}
                          className={formStyles.input}
                          onChange={(value) => onChange(mapSelectValueToString(value))}
                          options={timeOptions}
                          aria-label="分组间隔类型"
                        />
                      )}
                      control={control}
                      name="groupIntervalValueType"
                    />
                  </div>
                </>
              </Field>
              <Field
                label="重复间隔时间"
                description="成功发送警报后重新发送警报的等待时间"
                invalid={!!errors.repeatIntervalValue}
                error={errors.repeatIntervalValue?.message}
              >
                <>
                  <div className={cx(formStyles.container, formStyles.timingContainer)}>
                    <InputControl
                      render={({ field, fieldState: { invalid } }) => (
                        <Input
                          {...field}
                          className={formStyles.smallInput}
                          invalid={invalid}
                          aria-label="重复间隔时间的值"
                        />
                      )}
                      control={control}
                      name="repeatIntervalValue"
                      rules={{
                        validate: optionalPositiveInteger,
                      }}
                    />
                    <InputControl
                      render={({ field: { onChange, ref, ...field } }) => (
                        <Select
                          {...field}
                          className={formStyles.input}
                          menuPlacement="top"
                          onChange={(value) => onChange(mapSelectValueToString(value))}
                          options={timeOptions}
                          aria-label="重复间隔时间类型"
                        />
                      )}
                      control={control}
                      name="repeatIntervalValueType"
                    />
                  </div>
                </>
              </Field>
            </>
          )}
          <Field
            label="静音"
            data-testid="am-mute-timing-select"
            description="在策略中添加静音定时"
            invalid={!!errors.muteTimeIntervals}
          >
            <InputControl
              render={({ field: { onChange, ref, ...field } }) => (
                <MultiSelect
                  aria-label="静音"
                  {...field}
                  className={formStyles.input}
                  onChange={(value) => onChange(mapMultiSelectValueToStrings(value))}
                  options={muteTimingOptions}
                />
              )}
              control={control}
              name="muteTimeIntervals"
            />
          </Field>
          <div className={styles.buttonGroup}>
            <Button type="submit">保存策略</Button>
            <Button onClick={onCancel} fill="outline" type="button" variant="secondary">
              取消
            </Button>
          </div>
        </>
      )}
    </Form>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  const commonSpacing = theme.spacing(3.5);

  return {
    addMatcherBtn: css`
      margin-bottom: ${commonSpacing};
    `,
    matchersContainer: css`
      background-color: ${theme.colors.background.secondary};
      margin: ${theme.spacing(1, 0)};
      padding: ${theme.spacing(1, 4.6, 1, 1.5)};
      width: fit-content;
    `,
    matchersOperator: css`
      min-width: 140px;
    `,
    nestedPolicies: css`
      margin-top: ${commonSpacing};
    `,
    removeButton: css`
      margin-left: ${theme.spacing(1)};
      margin-top: ${theme.spacing(2.5)};
    `,
    buttonGroup: css`
      margin: ${theme.spacing(6)} 0 ${commonSpacing};

      & > * + * {
        margin-left: ${theme.spacing(1.5)};
      }
    `,
    noMatchersWarning: css`
      padding: ${theme.spacing(1)} ${theme.spacing(2)};
    `,
  };
};
