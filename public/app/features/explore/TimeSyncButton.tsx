import React from 'react';

import { Tooltip, ToolbarButton } from '@grafana/ui';

interface TimeSyncButtonProps {
  isSynced: boolean;
  onClick: () => void;
}

export function TimeSyncButton(props: TimeSyncButtonProps) {
  const { onClick, isSynced } = props;

  const syncTimesTooltip = () => {
    const { isSynced } = props;
    const tooltip = isSynced ? '取消所有视图同步' : '将所有视图同步到此时间范围';
    return <>{tooltip}</>;
  };

  return (
    <Tooltip content={syncTimesTooltip} placement="bottom">
      <ToolbarButton
        icon="link"
        variant={isSynced ? 'active' : 'default'}
        aria-label={isSynced ? 'Synced times' : 'Unsynced times'}
        onClick={onClick}
      />
    </Tooltip>
  );
}
