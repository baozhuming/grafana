import { css } from '@emotion/css';
import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';

import { GrafanaTheme2 } from '@grafana/data';
import { Button, Input, Field, FieldSet, useStyles2 } from '@grafana/ui';

import { MuteTimingFields } from '../../types/mute-timing-form';
import { DAYS_OF_THE_WEEK, MONTHS, validateArrayField, defaultTimeInterval } from '../../utils/mute-timings';

import { MuteTimingTimeRange } from './MuteTimingTimeRange';

export const MuteTimingTimeInterval = () => {
  const styles = useStyles2(getStyles);
  const { formState, register } = useFormContext();
  const {
    fields: timeIntervals,
    append: addTimeInterval,
    remove: removeTimeInterval,
  } = useFieldArray<MuteTimingFields>({
    name: 'time_intervals',
  });

  return (
    <FieldSet className={styles.timeIntervalLegend} label="时间间隔">
      <>
        <p>
          时间间隔是时间中某一时刻的定义。所有字段都是列表，并且必须满足至少一个列表元素才能匹配字段。如果字段为空，则任何时刻都将匹配该字段。要使一个瞬间的时间匹配一个完整的时间间隔，所有字段必须匹配。一个静音定时可以包含多个时间间隔
        </p>
        {timeIntervals.map((timeInterval, timeIntervalIndex) => {
          const errors = formState.errors;
          return (
            <div key={timeInterval.id} className={styles.timeIntervalSection}>
              <MuteTimingTimeRange intervalIndex={timeIntervalIndex} />
              <Field
                label="本周天数"
                error={errors.time_intervals?.[timeIntervalIndex]?.weekdays?.message ?? ''}
                invalid={!!errors.time_intervals?.[timeIntervalIndex]?.weekdays}
              >
                <Input
                  {...register(`time_intervals.${timeIntervalIndex}.weekdays`, {
                    validate: (value) =>
                      validateArrayField(value, (day) => DAYS_OF_THE_WEEK.includes(day.toLowerCase()), '无效的星期几'),
                  })}
                  className={styles.input}
                  data-testid="mute-timing-weekdays"
                  // @ts-ignore react-hook-form doesn't handle nested field arrays well
                  defaultValue={timeInterval.weekdays}
                  placeholder="例如: 星期一, 星期二:星期二"
                />
              </Field>
              <Field
                label="本月天数"
                description="一个月的天数，1-31。负值可以用来表示从月末开始的天数"
                invalid={!!errors.time_intervals?.[timeIntervalIndex]?.days_of_month}
                error={errors.time_intervals?.[timeIntervalIndex]?.days_of_month?.message}
              >
                <Input
                  {...register(`time_intervals.${timeIntervalIndex}.days_of_month`, {
                    validate: (value) =>
                      validateArrayField(
                        value,
                        (day) => {
                          const parsedDay = parseInt(day, 10);
                          return (parsedDay > -31 && parsedDay < 0) || (parsedDay > 0 && parsedDay < 32);
                        },
                        '无效的天数'
                      ),
                  })}
                  className={styles.input}
                  // @ts-ignore react-hook-form doesn't handle nested field arrays well
                  defaultValue={timeInterval.days_of_month}
                  placeholder="例如: 1, 14:16, -1"
                  data-testid="mute-timing-days"
                />
              </Field>
              <Field
                label="月份"
                description="一年中的几个月，用数字表示或用日历月表示"
                invalid={!!errors.time_intervals?.[timeIntervalIndex]?.months}
                error={errors.time_intervals?.[timeIntervalIndex]?.months?.message}
              >
                <Input
                  {...register(`time_intervals.${timeIntervalIndex}.months`, {
                    validate: (value) =>
                      validateArrayField(
                        value,
                        (month) => MONTHS.includes(month) || (parseInt(month, 10) < 13 && parseInt(month, 10) > 0),
                        '无效的月份'
                      ),
                  })}
                  className={styles.input}
                  placeholder="例如: 1:3, 5月:8月, 12月"
                  // @ts-ignore react-hook-form doesn't handle nested field arrays well
                  defaultValue={timeInterval.months}
                  data-testid="mute-timing-months"
                />
              </Field>
              <Field
                label="年份"
                invalid={!!errors.time_intervals?.[timeIntervalIndex]?.years}
                error={errors.time_intervals?.[timeIntervalIndex]?.years?.message ?? ''}
              >
                <Input
                  {...register(`time_intervals.${timeIntervalIndex}.years`, {
                    validate: (value) => validateArrayField(value, (year) => /^\d{4}$/.test(year), '无效的年份'),
                  })}
                  className={styles.input}
                  placeholder="例如: 2021:2022, 2030"
                  // @ts-ignore react-hook-form doesn't handle nested field arrays well
                  defaultValue={timeInterval.years}
                  data-testid="mute-timing-years"
                />
              </Field>
              <Button
                type="button"
                variant="destructive"
                icon="trash-alt"
                onClick={() => removeTimeInterval(timeIntervalIndex)}
              >
                删除时间间隔
              </Button>
            </div>
          );
        })}
        <Button
          type="button"
          variant="secondary"
          className={styles.removeTimeIntervalButton}
          onClick={() => {
            addTimeInterval(defaultTimeInterval);
          }}
          icon="plus"
        >
          添加另一个时间间隔
        </Button>
      </>
    </FieldSet>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  input: css`
    width: 400px;
  `,
  timeIntervalLegend: css`
    legend {
      font-size: 1.25rem;
    }
  `,
  timeIntervalSection: css`
    background-color: ${theme.colors.background.secondary};
    padding: ${theme.spacing(1)};
    margin-bottom: ${theme.spacing(1)};
  `,
  removeTimeIntervalButton: css`
    margin-top: ${theme.spacing(1)};
  `,
});
