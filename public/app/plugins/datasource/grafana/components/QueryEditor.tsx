import pluralize from 'pluralize';
import React, { PureComponent } from 'react';

import {
  QueryEditorProps,
  SelectableValue,
  dataFrameFromJSON,
  rangeUtil,
  DataQueryRequest,
  DataFrame,
} from '@grafana/data';
import { config, getBackendSrv, getDataSourceSrv } from '@grafana/runtime';
import { InlineField, Select, Alert, Input, InlineFieldRow, InlineLabel } from '@grafana/ui';
import { hasAlphaPanels } from 'app/core/config';
import { SearchQuery } from 'app/features/search/service';

import { GrafanaDatasource } from '../datasource';
import { defaultQuery, GrafanaQuery, GrafanaQueryType } from '../types';

import SearchEditor from './SearchEditor';

type Props = QueryEditorProps<GrafanaDatasource, GrafanaQuery>;

const labelWidth = 12;

interface State {
  channels: Array<SelectableValue<string>>;
  channelFields: Record<string, Array<SelectableValue<string>>>;
  folders?: Array<SelectableValue<string>>;
}

export class QueryEditor extends PureComponent<Props, State> {
  state: State = { channels: [], channelFields: {} };

  queryTypes: Array<SelectableValue<GrafanaQueryType>> = [
    {
      label: '随机',
      value: GrafanaQueryType.RandomWalk,
      description: '所选时间范围内的随机值',
    },
    {
      label: '实时测量',
      value: GrafanaQueryType.LiveMeasurements,
      description: '从Grafana实时测量',
    },
    {
      label: '列出公共文件',
      value: GrafanaQueryType.List,
      description: '显示公共资源的目录列表',
    },
  ];

  constructor(props: Props) {
    super(props);

    if (config.featureToggles.panelTitleSearch && hasAlphaPanels) {
      this.queryTypes.push({
        label: '搜索',
        value: GrafanaQueryType.Search,
        description: '搜索grafana资源',
      });
    }
  }

  loadChannelInfo() {
    getBackendSrv()
      .fetch({ url: 'api/live/list' })
      .subscribe({
        next: (v: any) => {
          const channelInfo = v.data?.channels as any[];
          if (channelInfo?.length) {
            const channelFields: Record<string, Array<SelectableValue<string>>> = {};
            const channels: Array<SelectableValue<string>> = channelInfo.map((c) => {
              if (c.data) {
                const distinctFields = new Set<string>();
                const frame = dataFrameFromJSON(c.data);
                for (const f of frame.fields) {
                  distinctFields.add(f.name);
                }
                channelFields[c.channel] = Array.from(distinctFields).map((n) => ({
                  value: n,
                  label: n,
                }));
              }
              return {
                value: c.channel,
                label: c.channel + ' [' + c.minute_rate + ' msg/min]',
              };
            });

            this.setState({ channelFields, channels });
          }
        },
      });
  }

  loadFolderInfo() {
    const query: DataQueryRequest<GrafanaQuery> = {
      targets: [{ queryType: GrafanaQueryType.List, refId: 'A' }],
    } as any;

    getDataSourceSrv()
      .get('-- Grafana --')
      .then((ds) => {
        const gds = ds as GrafanaDatasource;
        gds.query(query).subscribe({
          next: (rsp) => {
            if (rsp.data.length) {
              const names = (rsp.data[0] as DataFrame).fields[0];
              const folders = names.values.toArray().map((v) => ({
                value: v,
                label: v,
              }));
              this.setState({ folders });
            }
          },
        });
      });
  }

  componentDidMount() {
    this.loadChannelInfo();
  }

  onQueryTypeChange = (sel: SelectableValue<GrafanaQueryType>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, queryType: sel.value! });
    onRunQuery();

    // Reload the channel list
    this.loadChannelInfo();
  };

  onChannelChange = (sel: SelectableValue<string>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, channel: sel?.value });
    onRunQuery();
  };

  onFieldNamesChange = (item: SelectableValue<string>) => {
    const { onChange, query, onRunQuery } = this.props;
    let fields: string[] = [];
    if (Array.isArray(item)) {
      fields = item.map((v) => v.value);
    } else if (item.value) {
      fields = [item.value];
    }

    // When adding the first field, also add time (if it exists)
    if (fields.length === 1 && !query.filter?.fields?.length && query.channel) {
      const names = this.state.channelFields[query.channel] ?? [];
      const tf = names.find((f) => f.value === 'time' || f.value === 'Time');
      if (tf && tf.value && tf.value !== fields[0]) {
        fields = [tf.value, ...fields];
      }
    }

    onChange({
      ...query,
      filter: {
        ...query.filter,
        fields,
      },
    });
    onRunQuery();
  };

  checkAndUpdateValue = (key: keyof GrafanaQuery, txt: string) => {
    const { onChange, query, onRunQuery } = this.props;
    if (key === 'buffer') {
      let buffer: number | undefined;
      if (txt) {
        try {
          buffer = rangeUtil.intervalToSeconds(txt) * 1000;
        } catch (err) {
          console.warn('ERROR', err);
        }
      }
      onChange({
        ...query,
        buffer,
      });
    } else {
      onChange({
        ...query,
        [key]: txt,
      });
    }
    onRunQuery();
  };

  handleEnterKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') {
      return;
    }
    this.checkAndUpdateValue('buffer', (e.target as any).value);
  };

  handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    this.checkAndUpdateValue('buffer', e.target.value);
  };

  renderMeasurementsQuery() {
    let { channel, filter, buffer } = this.props.query;
    let { channels, channelFields } = this.state;
    let currentChannel = channels.find((c) => c.value === channel);
    if (channel && !currentChannel) {
      currentChannel = {
        value: channel,
        label: channel,
        description: `连接 ${channel}`,
      };
      channels = [currentChannel, ...channels];
    }

    const distinctFields = new Set<string>();
    const fields: Array<SelectableValue<string>> = channel ? channelFields[channel] ?? [] : [];
    // if (data && data.series?.length) {
    //   for (const frame of data.series) {
    //     for (const field of frame.fields) {
    //       if (distinctFields.has(field.name) || !field.name) {
    //         continue;
    //       }
    //       fields.push({
    //         value: field.name,
    //         label: field.name,
    //         description: `(${getFrameDisplayName(frame)} / ${field.type})`,
    //       });
    //       distinctFields.add(field.name);
    //     }
    //   }
    // }
    if (filter?.fields) {
      for (const f of filter.fields) {
        if (!distinctFields.has(f)) {
          fields.push({
            value: f,
            label: `${f} (未加载)`,
            description: `已配置，但在查询结果中未找到`,
          });
          distinctFields.add(f);
        }
      }
    }

    let formattedTime = '';
    if (buffer) {
      formattedTime = rangeUtil.secondsToHms(buffer / 1000);
    }

    return (
      <>
        <div className="gf-form">
          <InlineField label="通道" grow={true} labelWidth={labelWidth}>
            <Select
              options={channels}
              value={currentChannel || ''}
              onChange={this.onChannelChange}
              allowCustomValue={true}
              backspaceRemovesValue={true}
              placeholder="选择测量通道"
              isClearable={true}
              noOptionsMessage="输入通道名称"
              formatCreateLabel={(input: string) => `连接: ${input}`}
            />
          </InlineField>
        </div>
        {channel && (
          <div className="gf-form">
            <InlineField label="Fields" grow={true} labelWidth={labelWidth}>
              <Select
                options={fields}
                value={filter?.fields || []}
                onChange={this.onFieldNamesChange}
                allowCustomValue={true}
                backspaceRemovesValue={true}
                placeholder="所有字段"
                isClearable={true}
                noOptionsMessage="无法列出所有字段"
                formatCreateLabel={(input: string) => `字段: ${input}`}
                isSearchable={true}
                isMulti={true}
              />
            </InlineField>
            <InlineField label="缓冲">
              <Input
                placeholder="自动"
                width={12}
                defaultValue={formattedTime}
                onKeyDown={this.handleEnterKey}
                onBlur={this.handleBlur}
                spellCheck={false}
              />
            </InlineField>
          </div>
        )}

        <Alert title="Grafana实时测量" severity="info">
          这在Grafana核心中支持实时事件流，这个功能正在大力开发中，当它变得更适合生产时，预计接口和结构会发生变化
        </Alert>
      </>
    );
  }

  onFolderChanged = (sel: SelectableValue<string>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, path: sel?.value });
    onRunQuery();
  };

  renderListPublicFiles() {
    let { path } = this.props.query;
    let { folders } = this.state;
    if (!folders) {
      folders = [];
      this.loadFolderInfo();
    }
    const currentFolder = folders.find((f) => f.value === path);
    if (path && !currentFolder) {
      folders = [
        ...folders,
        {
          value: path,
          label: path,
        },
      ];
    }

    return (
      <InlineFieldRow>
        <InlineField label="路径" grow={true} labelWidth={labelWidth}>
          <Select
            options={folders}
            value={currentFolder || ''}
            onChange={this.onFolderChanged}
            allowCustomValue={true}
            backspaceRemovesValue={true}
            placeholder="选择文件夹"
            isClearable={true}
            formatCreateLabel={(input: string) => `Folder: ${input}`}
          />
        </InlineField>
      </InlineFieldRow>
    );
  }

  renderSnapshotQuery() {
    const { query } = this.props;

    return (
      <InlineFieldRow>
        <InlineField label="快照" grow={true} labelWidth={labelWidth}>
          <InlineLabel>{pluralize('frame', query.snapshot?.length ?? 0, true)}</InlineLabel>
        </InlineField>
      </InlineFieldRow>
    );
  }

  onSearchChange = (search: SearchQuery) => {
    const { query, onChange, onRunQuery } = this.props;

    onChange({
      ...query,
      search,
    });
    onRunQuery();
  };

  render() {
    const query = {
      ...defaultQuery,
      ...this.props.query,
    };

    const { queryType } = query;

    // Only show "snapshot" when it already exists
    let queryTypes = this.queryTypes;
    if (queryType === GrafanaQueryType.Snapshot) {
      queryTypes = [
        ...this.queryTypes,
        {
          label: '快照',
          value: queryType,
        },
      ];
    }

    return (
      <>
        {queryType === GrafanaQueryType.Search && (
          <Alert title="Grafana搜索" severity="info">
            使用这个数据源调用新的搜索系统是实验性的，可能会随时更改，恕不另行通知
          </Alert>
        )}
        <InlineFieldRow>
          <InlineField label="查询类型" grow={true} labelWidth={labelWidth}>
            <Select
              options={queryTypes}
              value={queryTypes.find((v) => v.value === queryType) || queryTypes[0]}
              onChange={this.onQueryTypeChange}
            />
          </InlineField>
        </InlineFieldRow>
        {queryType === GrafanaQueryType.LiveMeasurements && this.renderMeasurementsQuery()}
        {queryType === GrafanaQueryType.List && this.renderListPublicFiles()}
        {queryType === GrafanaQueryType.Snapshot && this.renderSnapshotQuery()}
        {queryType === GrafanaQueryType.Search && (
          <SearchEditor value={query.search ?? {}} onChange={this.onSearchChange} />
        )}
      </>
    );
  }
}
