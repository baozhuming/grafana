import { css } from '@emotion/css';
import React, { ReactElement } from 'react';
import { useLocation } from 'react-router-dom';

import { SelectableValue, GrafanaTheme2 } from '@grafana/data';
import { locationSearchToObject } from '@grafana/runtime';
import { LoadingPlaceholder, Select, RadioButtonGroup, useStyles2, Tooltip } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { GrafanaRouteComponentProps } from 'app/core/navigation/types';
import { getNavModel } from 'app/core/selectors/navModel';
import { useSelector } from 'app/types';

import { HorizontalGroup } from '../components/HorizontalGroup';
import { PluginList } from '../components/PluginList';
import { SearchField } from '../components/SearchField';
import { Sorters } from '../helpers';
import { useHistory } from '../hooks/useHistory';
import { useGetAllWithFilters, useIsRemotePluginsAvailable, useDisplayMode } from '../state/hooks';
import { PluginListDisplayMode } from '../types';

export default function Browse({ route }: GrafanaRouteComponentProps): ReactElement | null {
  const location = useLocation();
  const locationSearch = locationSearchToObject(location.search);
  const navModel = useSelector((state) => getNavModel(state.navIndex, 'plugins'));
  const { displayMode, setDisplayMode } = useDisplayMode();
  const styles = useStyles2(getStyles);
  const history = useHistory();
  const remotePluginsAvailable = useIsRemotePluginsAvailable();
  const query = (locationSearch.q as string) || '';
  const filterBy = (locationSearch.filterBy as string) || 'installed';
  const filterByType = (locationSearch.filterByType as string) || 'all';
  const sortBy = (locationSearch.sortBy as Sorters) || Sorters.nameAsc;
  const { isLoading, error, plugins } = useGetAllWithFilters({
    query,
    filterBy,
    filterByType,
    sortBy,
  });
  const filterByOptions = [
    { value: 'all', label: '所有' },
    { value: 'installed', label: '已安装' },
  ];

  const onSortByChange = (value: SelectableValue<string>) => {
    history.push({ query: { sortBy: value.value } });
  };

  const onFilterByChange = (value: string) => {
    history.push({ query: { filterBy: value } });
  };

  const onFilterByTypeChange = (value: string) => {
    history.push({ query: { filterByType: value } });
  };

  const onSearch = (q: string) => {
    history.push({ query: { filterBy: 'all', filterByType: 'all', q } });
  };

  // How should we handle errors?
  if (error) {
    console.error(error.message);
    return null;
  }

  return (
    <Page navModel={navModel}>
      <Page.Contents>
        <HorizontalGroup wrap>
          <SearchField value={query} onSearch={onSearch} />
          <HorizontalGroup wrap className={styles.actionBar}>
            {/* Filter by type */}
            <div>
              <RadioButtonGroup
                value={filterByType}
                onChange={onFilterByTypeChange}
                options={[
                  { value: 'all', label: '所有' },
                  { value: 'datasource', label: '数据源' },
                  { value: 'panel', label: '面板' },
                  { value: 'app', label: '应用程序' },
                ]}
              />
            </div>

            {/* Filter by installed / all */}
            {remotePluginsAvailable ? (
              <div>
                <RadioButtonGroup value={filterBy} onChange={onFilterByChange} options={filterByOptions} />
              </div>
            ) : (
              <Tooltip content="此过滤器已被禁用，因为Grafana服务器无法访问grafana.com" placement="top">
                <div>
                  <RadioButtonGroup
                    disabled={true}
                    value={filterBy}
                    onChange={onFilterByChange}
                    options={filterByOptions}
                  />
                </div>
              </Tooltip>
            )}

            {/* Sorting */}
            <div>
              <Select
                aria-label="Sort Plugins List"
                width={24}
                value={sortBy}
                onChange={onSortByChange}
                options={[
                  { value: 'nameAsc', label: '按名称排序 (A-Z)' },
                  { value: 'nameDesc', label: '按名称排序 (Z-A)' },
                  { value: 'updated', label: '按更新日期排序' },
                  { value: 'published', label: '按发布日期排序' },
                  { value: 'downloads', label: '按下载量排序' },
                ]}
              />
            </div>

            {/* Display mode */}
            <div>
              <RadioButtonGroup<PluginListDisplayMode>
                className={styles.displayAs}
                value={displayMode}
                onChange={setDisplayMode}
                options={[
                  {
                    value: PluginListDisplayMode.Grid,
                    icon: 'table',
                    description: '在网格布局中显示插件',
                  },
                  { value: PluginListDisplayMode.List, icon: 'list-ul', description: '在列表中显示插件' },
                ]}
              />
            </div>
          </HorizontalGroup>
        </HorizontalGroup>
        <div className={styles.listWrap}>
          {isLoading ? (
            <LoadingPlaceholder
              className={css`
                margin-bottom: 0;
              `}
              text="正在加载数据"
            />
          ) : (
            <PluginList plugins={plugins} displayMode={displayMode} />
          )}
        </div>
      </Page.Contents>
    </Page>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  actionBar: css`
    ${theme.breakpoints.up('xl')} {
      margin-left: auto;
    }
  `,
  listWrap: css`
    margin-top: ${theme.spacing(2)};
  `,
  displayAs: css`
    svg {
      margin-right: 0;
    }
  `,
});
