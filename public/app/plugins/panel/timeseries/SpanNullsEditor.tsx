import React from 'react';

import { FieldOverrideEditorProps, rangeUtil, SelectableValue } from '@grafana/data';
import { HorizontalGroup, Input, RadioButtonGroup } from '@grafana/ui';

const GAPS_OPTIONS: Array<SelectableValue<boolean | number>> = [
  {
    label: '从不',
    value: false,
  },
  {
    label: '始终',
    value: true,
  },
  {
    label: '阈值',
    value: 3600000, // 1h
  },
];

export const SpanNullsEditor: React.FC<FieldOverrideEditorProps<boolean | number, any>> = ({ value, onChange }) => {
  const isThreshold = typeof value === 'number';
  const formattedTime = isThreshold ? rangeUtil.secondsToHms((value as number) / 1000) : undefined;
  GAPS_OPTIONS[2].value = isThreshold ? (value as number) : 3600000; // 1h

  const checkAndUpdate = (txt: string) => {
    let val: boolean | number = false;
    if (txt) {
      try {
        val = rangeUtil.intervalToSeconds(txt) * 1000;
      } catch (err) {
        console.warn('ERROR', err);
      }
    }
    onChange(val);
  };

  const handleEnterKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') {
      return;
    }
    checkAndUpdate((e.target as any).value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    checkAndUpdate(e.target.value);
  };

  return (
    <HorizontalGroup>
      <RadioButtonGroup value={value} options={GAPS_OPTIONS} onChange={onChange} />
      {isThreshold && (
        <Input
          autoFocus={false}
          placeholder="从不"
          width={10}
          defaultValue={formattedTime}
          onKeyDown={handleEnterKey}
          onBlur={handleBlur}
          prefix={<div>&lt;</div>}
          spellCheck={false}
        />
      )}
    </HorizontalGroup>
  );
};
