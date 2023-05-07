import React, { FC, useMemo } from 'react';

import { SelectableValue } from '@grafana/data';
import { Select } from '@grafana/ui';
import { SelectBaseProps } from '@grafana/ui/src/components/Select/types';
import { GrafanaAlertStateDecision } from 'app/types/unified-alerting-dto';

type Props = Omit<SelectBaseProps<GrafanaAlertStateDecision>, 'options'> & {
  includeNoData: boolean;
  includeError: boolean;
};

const options: SelectableValue[] = [
  { value: GrafanaAlertStateDecision.Alerting, label: '警报' },
  { value: GrafanaAlertStateDecision.NoData, label: '无数据' },
  { value: GrafanaAlertStateDecision.OK, label: '正常' },
  { value: GrafanaAlertStateDecision.Error, label: '错误' },
];

export const GrafanaAlertStatePicker: FC<Props> = ({ includeNoData, includeError, ...props }) => {
  const opts = useMemo(() => {
    if (!includeNoData) {
      return options.filter((opt) => opt.value !== GrafanaAlertStateDecision.NoData);
    }
    if (!includeError) {
      return options.filter((opt) => opt.value !== GrafanaAlertStateDecision.Error);
    }
    return options;
  }, [includeNoData, includeError]);
  return <Select options={opts} {...props} />;
};
