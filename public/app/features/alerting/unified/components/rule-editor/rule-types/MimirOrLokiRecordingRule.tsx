import React, { FC } from 'react';

import { RuleFormType } from '../../../types/rule-form';

import { DisabledTooltip } from './DisabledTooltip';
import { RuleType, SharedProps } from './RuleType';

const RecordingRuleType: FC<SharedProps> = ({ selected = false, disabled = false, onClick }) => {
  return (
    <DisabledTooltip visible={disabled}>
      <RuleType
        name="Mimir或Loki录制规则"
        description={
          <span>
            预先执行表达式
            <br />
            应该与警报规则结合使用
          </span>
        }
        image="public/img/alerting/mimir_logo_recording.svg"
        selected={selected}
        disabled={disabled}
        value={RuleFormType.cloudRecording}
        onClick={onClick}
      />
    </DisabledTooltip>
  );
};

export { RecordingRuleType };
