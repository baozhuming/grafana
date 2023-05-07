import React from 'react';

import { Tooltip } from '@grafana/ui';

type Props = {
  visible: boolean;
};

const DisabledTooltip = ({ children, visible = false }: React.PropsWithChildren<Props>) => {
  if (!visible) {
    return <>{children}</>;
  }

  return (
    <Tooltip content="您似乎没有任何兼容的数据源" placement="top">
      <div>{children}</div>
    </Tooltip>
  );
};

export { DisabledTooltip };
