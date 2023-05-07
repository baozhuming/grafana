import { css } from '@emotion/css';
import React, { useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Alert, ConfirmModal, useStyles2, Button } from '@grafana/ui';

interface Props {
  onHideApiKeys: () => void;
}

export const APIKeysMigratedCard = ({ onHideApiKeys }: Props): JSX.Element => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const styles = useStyles2(getStyles);

  return (
    <Alert title="API密钥已迁移到Grafana服务帐户，此选项卡已弃用" severity="info">
      <div className={styles.text}>
        我们已经将API密钥迁移到Grafana服务帐户中，所有API密钥都是安全的，并继续像以前一样工作，您可以在各自的服务帐户中找到它们
      </div>
      <div className={styles.actionRow}>
        <Button className={styles.actionButton} onClick={() => setIsModalOpen(true)}>
          永远隐藏API密钥页面
        </Button>
        <ConfirmModal
          title={'永远隐藏API密钥页面'}
          isOpen={isModalOpen}
          body={'您确定要永远隐藏API密钥页面并从现在开始使用服务帐户吗?'}
          confirmText={'是的，隐藏API密钥页面'}
          onConfirm={onHideApiKeys}
          onDismiss={() => setIsModalOpen(false)}
        />
        <a href="org/serviceaccounts">查看服务帐户页面</a>
      </div>
    </Alert>
  );
};

export const getStyles = (theme: GrafanaTheme2) => ({
  text: css`
    margin-bottom: ${theme.spacing(2)};
  `,
  actionRow: css`
    display: flex;
    align-items: center;
  `,
  actionButton: css`
    margin-right: ${theme.spacing(2)};
  `,
});
