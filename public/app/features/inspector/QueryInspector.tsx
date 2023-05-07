import { css } from '@emotion/css';
import React, { PureComponent } from 'react';
import { Subscription } from 'rxjs';

import { DataFrame } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { Stack } from '@grafana/experimental';
import { config, RefreshEvent } from '@grafana/runtime';
import { Button, ClipboardButton, JSONFormatter, LoadingPlaceholder } from '@grafana/ui';
import { backendSrv } from 'app/core/services/backend_srv';
import { supportsDataQuery } from 'app/features/dashboard/components/PanelEditor/utils';
import { PanelModel } from 'app/features/dashboard/state';

import { getPanelInspectorStyles } from './styles';

interface DsQuery {
  isLoading: boolean;
  response: {};
}

interface ExecutedQueryInfo {
  refId: string;
  query: string;
  frames: number;
  rows: number;
}

interface Props {
  data: DataFrame[];
  onRefreshQuery: () => void;
  panel?: PanelModel;
}

interface State {
  allNodesExpanded: boolean | null;
  isMocking: boolean;
  mockedResponse: string;
  dsQuery: DsQuery;
  executedQueries: ExecutedQueryInfo[];
}

export class QueryInspector extends PureComponent<Props, State> {
  private formattedJson: any;
  private subs = new Subscription();

  constructor(props: Props) {
    super(props);
    this.state = {
      executedQueries: [],
      allNodesExpanded: null,
      isMocking: false,
      mockedResponse: '',
      dsQuery: {
        isLoading: false,
        response: {},
      },
    };
  }

  componentDidMount() {
    const { panel } = this.props;

    this.subs.add(
      backendSrv.getInspectorStream().subscribe({
        next: (response) => this.onDataSourceResponse(response),
      })
    );

    if (panel) {
      this.subs.add(panel.events.subscribe(RefreshEvent, this.onPanelRefresh));
      this.updateQueryList();
    }
  }

  componentDidUpdate(oldProps: Props) {
    if (this.props.data !== oldProps.data) {
      this.updateQueryList();
    }
  }

  /**
   * Find the list of executed queries
   */
  updateQueryList() {
    const { data } = this.props;
    const executedQueries: ExecutedQueryInfo[] = [];

    if (data?.length) {
      let last: ExecutedQueryInfo | undefined = undefined;

      data.forEach((frame, idx) => {
        const query = frame.meta?.executedQueryString;

        if (query) {
          const refId = frame.refId || '?';

          if (last?.refId === refId) {
            last.frames++;
            last.rows += frame.length;
          } else {
            last = {
              refId,
              frames: 0,
              rows: frame.length,
              query,
            };
            executedQueries.push(last);
          }
        }
      });
    }

    this.setState({ executedQueries });
  }

  componentWillUnmount() {
    this.subs.unsubscribe();
  }

  onPanelRefresh = () => {
    this.setState((prevState) => ({
      ...prevState,
      dsQuery: {
        isLoading: true,
        response: {},
      },
    }));
  };

  onDataSourceResponse(response: any) {
    // ignore silent requests
    if (response.config?.hideFromInspector) {
      return;
    }

    response = { ...response }; // clone - dont modify the response

    if (response.headers) {
      delete response.headers;
    }

    if (response.config) {
      response.request = response.config;

      delete response.config;
      delete response.request.transformRequest;
      delete response.request.transformResponse;
      delete response.request.paramSerializer;
      delete response.request.jsonpCallbackParam;
      delete response.request.headers;
      delete response.request.requestId;
      delete response.request.inspect;
      delete response.request.retry;
      delete response.request.timeout;
    }

    if (response.data) {
      response.response = response.data;

      delete response.config;
      delete response.data;
      delete response.status;
      delete response.statusText;
      delete response.ok;
      delete response.url;
      delete response.redirected;
      delete response.type;
      delete response.$$config;
    }

    this.setState((prevState) => ({
      ...prevState,
      dsQuery: {
        isLoading: false,
        response: response,
      },
    }));
  }

  setFormattedJson = (formattedJson: any) => {
    this.formattedJson = formattedJson;
  };

  getTextForClipboard = () => {
    return JSON.stringify(this.formattedJson, null, 2);
  };

  onToggleExpand = () => {
    this.setState((prevState) => ({
      ...prevState,
      allNodesExpanded: !this.state.allNodesExpanded,
    }));
  };

  onToggleMocking = () => {
    this.setState((prevState) => ({
      ...prevState,
      isMocking: !this.state.isMocking,
    }));
  };

  getNrOfOpenNodes = () => {
    if (this.state.allNodesExpanded === null) {
      return 3; // 3 is default, ie when state is null
    } else if (this.state.allNodesExpanded) {
      return 20;
    }
    return 1;
  };

  setMockedResponse = (evt: any) => {
    const mockedResponse = evt.target.value;
    this.setState((prevState) => ({
      ...prevState,
      mockedResponse,
    }));
  };

  renderExecutedQueries(executedQueries: ExecutedQueryInfo[]) {
    if (!executedQueries.length) {
      return null;
    }

    const styles = {
      refId: css`
        font-weight: ${config.theme.typography.weight.semibold};
        color: ${config.theme.colors.textBlue};
        margin-right: 8px;
      `,
    };

    return (
      <div>
        {executedQueries.map((info) => {
          return (
            <Stack key={info.refId} gap={1} direction="column">
              <div>
                <span className={styles.refId}>{info.refId}:</span>
                {info.frames > 1 && <span>{info.frames} frames, </span>}
                <span>{info.rows} rows</span>
              </div>
              <pre>{info.query}</pre>
            </Stack>
          );
        })}
      </div>
    );
  }

  render() {
    const { allNodesExpanded, executedQueries } = this.state;
    const { panel, onRefreshQuery } = this.props;
    const { response, isLoading } = this.state.dsQuery;
    const openNodes = this.getNrOfOpenNodes();
    const styles = getPanelInspectorStyles();
    const haveData = Object.keys(response).length > 0;

    if (panel && !supportsDataQuery(panel.plugin)) {
      return null;
    }

    return (
      <div className={styles.wrap}>
        <div aria-label={selectors.components.PanelInspector.Query.content}>
          <h3 className="section-heading">查询检查器</h3>
          <p className="small muted">
            查询检查器允许您查看原始请求和响应，为了收集这些数据，Grafana需要发出一个新的查询，单击下面的刷新按钮触发一个新的查询
          </p>
        </div>
        {this.renderExecutedQueries(executedQueries)}
        <div className={styles.toolbar}>
          <Button
            icon="sync"
            onClick={onRefreshQuery}
            aria-label={selectors.components.PanelInspector.Query.refreshButton}
          >
            刷新
          </Button>

          {haveData && allNodesExpanded && (
            <Button icon="minus" variant="secondary" className={styles.toolbarItem} onClick={this.onToggleExpand}>
              全部折叠
            </Button>
          )}
          {haveData && !allNodesExpanded && (
            <Button icon="plus" variant="secondary" className={styles.toolbarItem} onClick={this.onToggleExpand}>
              全部展开
            </Button>
          )}

          {haveData && (
            <ClipboardButton
              getText={this.getTextForClipboard}
              className={styles.toolbarItem}
              icon="copy"
              variant="secondary"
            >
              复制到剪贴板
            </ClipboardButton>
          )}
          <div className="flex-grow-1" />
        </div>
        <div className={styles.content}>
          {isLoading && <LoadingPlaceholder text="加载查询检查器..." />}
          {!isLoading && haveData && (
            <JSONFormatter json={response} open={openNodes} onDidRender={this.setFormattedJson} />
          )}
          {!isLoading && !haveData && <p className="muted">尚未收集到请求和响应，点击刷新按钮</p>}
        </div>
      </div>
    );
  }
}
