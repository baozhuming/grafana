import React, { FC } from 'react';

import { LoadingPlaceholder } from '@grafana/ui';

interface Props {
  pageName?: string;
}

const PageLoader: FC<Props> = ({ pageName = '' }) => {
  const loadingText = `${pageName}加载中...`;
  return (
    <div className="page-loader-wrapper">
      <LoadingPlaceholder text={loadingText} />
    </div>
  );
};

export default PageLoader;
