import { css } from '@emotion/css';
import React, { FC, useState } from 'react';
import { useDebounce } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { Button, Icon, Input, Label, useStyles2 } from '@grafana/ui';
import { contextSrv } from 'app/core/services/context_srv';

import { Authorize } from '../../components/Authorize';
import { useURLSearchParams } from '../../hooks/useURLSearchParams';
import { AmRouteReceiver, FormAmRoute } from '../../types/amroutes';
import { getNotificationsPermissions } from '../../utils/access-control';
import { emptyArrayFieldMatcher, emptyRoute } from '../../utils/amroutes';
import { getNotificationPoliciesFilters } from '../../utils/misc';
import { EmptyArea } from '../EmptyArea';
import { EmptyAreaWithCTA } from '../EmptyAreaWithCTA';

import { AmRoutesTable } from './AmRoutesTable';
import { LabelMatcherFilter } from './LabelMatcherFilter';

export interface AmSpecificRoutingProps {
  alertManagerSourceName: string;
  onChange: (routes: FormAmRoute) => void;
  onRootRouteEdit: () => void;
  receivers: AmRouteReceiver[];
  routes: FormAmRoute;
  readOnly?: boolean;
}

interface Filters {
  queryString?: string;
  contactPoint?: string;
}

export const AmSpecificRouting: FC<AmSpecificRoutingProps> = ({
  alertManagerSourceName,
  onChange,
  onRootRouteEdit,
  receivers,
  routes,
  readOnly = false,
}) => {
  const [actualRoutes, setActualRoutes] = useState([...routes.routes]);
  const [isAddMode, setIsAddMode] = useState(false);
  const permissions = getNotificationsPermissions(alertManagerSourceName);
  const canCreateNotifications = contextSrv.hasPermission(permissions.create);

  const [searchParams, setSearchParams] = useURLSearchParams();
  const { queryString, contactPoint } = getNotificationPoliciesFilters(searchParams);

  const [filters, setFilters] = useState<Filters>({ queryString, contactPoint });

  useDebounce(
    () => {
      setSearchParams({ queryString: filters.queryString, contactPoint: filters.contactPoint });
    },
    400,
    [filters]
  );

  const styles = useStyles2(getStyles);

  const clearFilters = () => {
    setFilters({ queryString: undefined, contactPoint: undefined });
    setSearchParams({ queryString: undefined, contactPoint: undefined });
  };

  const addNewRoute = () => {
    clearFilters();
    setIsAddMode(true);
    setActualRoutes(() => [
      ...routes.routes,
      {
        ...emptyRoute,
        matchers: [emptyArrayFieldMatcher],
      },
    ]);
  };

  const onCancelAdd = () => {
    setIsAddMode(false);
    setActualRoutes([...routes.routes]);
  };

  const onTableRouteChange = (newRoutes: FormAmRoute[]): void => {
    onChange({
      ...routes,
      routes: newRoutes,
    });

    if (isAddMode) {
      setIsAddMode(false);
    }
  };
  return (
    <div className={styles.container}>
      <h5>特定策略</h5>
      <p>根据匹配条件向选定的联络点发送特定警报</p>
      {!routes.receiver ? (
        readOnly ? (
          <EmptyArea>
            <p>主路由没有配置默认的接触点</p>
          </EmptyArea>
        ) : (
          <EmptyAreaWithCTA
            buttonIcon="rocket"
            buttonLabel="设置默认连接点"
            onButtonClick={onRootRouteEdit}
            text="您还没有为主路由设置默认的连接点"
            showButton={canCreateNotifications}
          />
        )
      ) : actualRoutes.length > 0 ? (
        <>
          <div>
            {!isAddMode && (
              <div className={styles.searchContainer}>
                <LabelMatcherFilter
                  onFilterChange={(filter) =>
                    setFilters((currentFilters) => ({ ...currentFilters, queryString: filter }))
                  }
                  defaultQueryString={filters.queryString ?? ''}
                  className={styles.filterInput}
                />
                <div className={styles.filterInput}>
                  <Label>按连接点搜索</Label>
                  <Input
                    onChange={({ currentTarget }) =>
                      setFilters((currentFilters) => ({ ...currentFilters, contactPoint: currentTarget.value }))
                    }
                    value={filters.contactPoint ?? ''}
                    placeholder="按连接点搜索"
                    data-testid="search-query-input"
                    prefix={<Icon name={'search'} />}
                  />
                </div>
                {(queryString || contactPoint) && (
                  <Button variant="secondary" icon="times" onClick={clearFilters} className={styles.clearFilterBtn}>
                    清空过滤条件
                  </Button>
                )}
              </div>
            )}

            {!isAddMode && !readOnly && (
              <Authorize actions={[permissions.create]}>
                <div className={styles.addMatcherBtnRow}>
                  <Button className={styles.addMatcherBtn} icon="plus" onClick={addNewRoute} type="button">
                    新建策略
                  </Button>
                </div>
              </Authorize>
            )}
          </div>
          <AmRoutesTable
            isAddMode={isAddMode}
            readOnly={readOnly}
            onCancelAdd={onCancelAdd}
            onChange={onTableRouteChange}
            receivers={receivers}
            routes={actualRoutes}
            filters={{ queryString, contactPoint }}
            alertManagerSourceName={alertManagerSourceName}
          />
        </>
      ) : readOnly ? (
        <EmptyArea>
          <p>没有配置特定的策略</p>
        </EmptyArea>
      ) : (
        <EmptyAreaWithCTA
          buttonIcon="plus"
          buttonLabel="新建特定策略"
          onButtonClick={addNewRoute}
          text="您还没有创建任何特定的策略"
          showButton={canCreateNotifications}
        />
      )}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css`
      display: flex;
      flex-flow: column wrap;
    `,
    searchContainer: css`
      display: flex;
      flex-flow: row nowrap;
      padding-bottom: ${theme.spacing(2)};
      border-bottom: 1px solid ${theme.colors.border.strong};
    `,
    clearFilterBtn: css`
      align-self: flex-end;
      margin-left: ${theme.spacing(1)};
    `,
    filterInput: css`
      width: 340px;
      & + & {
        margin-left: ${theme.spacing(1)};
      }
    `,
    addMatcherBtnRow: css`
      display: flex;
      flex-flow: column nowrap;
      padding: ${theme.spacing(2)} 0;
    `,
    addMatcherBtn: css`
      align-self: flex-end;
    `,
  };
};
