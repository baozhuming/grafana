import { css } from '@emotion/css';
import React, { FC } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Button, useStyles2 } from '@grafana/ui';

import { Authorize } from '../../components/Authorize';
import { AmRouteReceiver, FormAmRoute } from '../../types/amroutes';
import { getNotificationsPermissions } from '../../utils/access-control';

import { AmRootRouteForm } from './AmRootRouteForm';
import { AmRootRouteRead } from './AmRootRouteRead';

export interface AmRootRouteProps {
  isEditMode: boolean;
  onEnterEditMode: () => void;
  onExitEditMode: () => void;
  onSave: (data: Partial<FormAmRoute>) => void;
  receivers: AmRouteReceiver[];
  routes: FormAmRoute;
  alertManagerSourceName: string;
  readOnly?: boolean;
}

export const AmRootRoute: FC<AmRootRouteProps> = ({
  isEditMode,
  onSave,
  onEnterEditMode,
  onExitEditMode,
  receivers,
  routes,
  alertManagerSourceName,
  readOnly = false,
}) => {
  const styles = useStyles2(getStyles);

  const permissions = getNotificationsPermissions(alertManagerSourceName);

  return (
    <div className={styles.container} data-testid="am-root-route-container">
      <div className={styles.titleContainer}>
        <h5 className={styles.title}>
          主策略 - <i>所有警报的默认值</i>
        </h5>
        {!isEditMode && !readOnly && (
          <Authorize actions={[permissions.update]}>
            <Button icon="pen" onClick={onEnterEditMode} size="sm" type="button" variant="secondary">
              编辑
            </Button>
          </Authorize>
        )}
      </div>
      <p>所有警报都将转到默认联系人点，除非您在特定路由区域中设置了其他匹配器</p>
      {isEditMode ? (
        <AmRootRouteForm
          alertManagerSourceName={alertManagerSourceName}
          onCancel={onExitEditMode}
          onSave={onSave}
          receivers={receivers}
          routes={routes}
        />
      ) : (
        <AmRootRouteRead routes={routes} />
      )}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css`
      background-color: ${theme.colors.background.secondary};
      color: ${theme.colors.text.secondary};
      padding: ${theme.spacing(2)};
    `,
    titleContainer: css`
      color: ${theme.colors.text.primary};
      display: flex;
      flex-flow: row nowrap;
    `,
    title: css`
      flex: 100%;
    `,
  };
};
