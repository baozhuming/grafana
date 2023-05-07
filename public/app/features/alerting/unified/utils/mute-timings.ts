import { omitBy, isUndefined } from 'lodash';

import { MuteTimeInterval, TimeInterval } from 'app/plugins/datasource/alertmanager/types';

import { MuteTimingFields, MuteTimingIntervalFields } from '../types/mute-timing-form';

export const DAYS_OF_THE_WEEK = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期天'];

export const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

export const defaultTimeInterval: MuteTimingIntervalFields = {
  times: [{ start_time: '', end_time: '' }],
  weekdays: '',
  days_of_month: '',
  months: '',
  years: '',
};

export const validateArrayField = (value: string, validateValue: (input: string) => boolean, invalidText: string) => {
  if (value) {
    return (
      value
        .split(',')
        .map((x) => x.trim())
        .every((entry) => entry.split(':').every(validateValue)) || invalidText
    );
  } else {
    return true;
  }
};

const convertStringToArray = (str: string) => {
  return str ? str.split(',').map((s) => s.trim()) : undefined;
};

export const createMuteTiming = (fields: MuteTimingFields): MuteTimeInterval => {
  const timeIntervals: TimeInterval[] = fields.time_intervals.map(
    ({ times, weekdays, days_of_month, months, years }) => {
      const interval = {
        times: times.filter(({ start_time, end_time }) => !!start_time && !!end_time),
        weekdays: convertStringToArray(weekdays)?.map((v) => v.toLowerCase()),
        days_of_month: convertStringToArray(days_of_month),
        months: convertStringToArray(months),
        years: convertStringToArray(years),
      };

      return omitBy(interval, isUndefined);
    }
  );

  return {
    name: fields.name,
    time_intervals: timeIntervals,
  };
};
