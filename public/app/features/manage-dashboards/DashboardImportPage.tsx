import { css } from '@emotion/css';
import React, { FormEvent, PureComponent } from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { AppEvents, GrafanaTheme2, LoadingState, NavModelItem } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { reportInteraction } from '@grafana/runtime';
import {
  Button,
  Field,
  FileUpload,
  Form,
  HorizontalGroup,
  Input,
  Spinner,
  stylesFactory,
  TextArea,
  Themeable2,
  VerticalGroup,
  withTheme2,
} from '@grafana/ui';
import appEvents from 'app/core/app_events';
import { Page } from 'app/core/components/Page/Page';
import { GrafanaRouteComponentProps } from 'app/core/navigation/types';
import { StoreState } from 'app/types';

import { cleanUpAction } from '../../core/actions/cleanUp';

import { ImportDashboardOverview } from './components/ImportDashboardOverview';
import { fetchGcomDashboard, importDashboardJson } from './state/actions';
import { initialImportDashboardState } from './state/reducers';
import { validateDashboardJson, validateGcomDashboard } from './utils/validation';

type DashboardImportPageRouteSearchParams = {
  gcomDashboardId?: string;
};

type OwnProps = Themeable2 & GrafanaRouteComponentProps<{}, DashboardImportPageRouteSearchParams>;

const IMPORT_STARTED_EVENT_NAME = 'dashboard_import_loaded';

const mapStateToProps = (state: StoreState) => ({
  loadingState: state.importDashboard.state,
});

const mapDispatchToProps = {
  fetchGcomDashboard,
  importDashboardJson,
  cleanUpAction,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

type Props = OwnProps & ConnectedProps<typeof connector>;

class UnthemedDashboardImport extends PureComponent<Props> {
  constructor(props: Props) {
    super(props);
    const { gcomDashboardId } = this.props.queryParams;
    if (gcomDashboardId) {
      this.getGcomDashboard({ gcomDashboard: gcomDashboardId });
      return;
    }
  }

  componentWillUnmount() {
    this.props.cleanUpAction({ cleanupAction: (state) => (state.importDashboard = initialImportDashboardState) });
  }

  onFileUpload = (event: FormEvent<HTMLInputElement>) => {
    reportInteraction(IMPORT_STARTED_EVENT_NAME, {
      import_source: 'json_uploaded',
    });

    const { importDashboardJson } = this.props;
    const file = event.currentTarget.files && event.currentTarget.files.length > 0 && event.currentTarget.files[0];

    if (file) {
      const reader = new FileReader();
      const readerOnLoad = () => {
        return (e: any) => {
          let dashboard: any;
          try {
            dashboard = JSON.parse(e.target.result);
          } catch (error) {
            if (error instanceof Error) {
              appEvents.emit(AppEvents.alertError, ['导入失败', 'JSON -> JS序列化失败：' + error.message]);
            }
            return;
          }
          importDashboardJson(dashboard);
        };
      };
      reader.onload = readerOnLoad();
      reader.readAsText(file);
    }
  };

  getDashboardFromJson = (formData: { dashboardJson: string }) => {
    reportInteraction(IMPORT_STARTED_EVENT_NAME, {
      import_source: 'json_pasted',
    });

    this.props.importDashboardJson(JSON.parse(formData.dashboardJson));
  };

  getGcomDashboard = (formData: { gcomDashboard: string }) => {
    reportInteraction(IMPORT_STARTED_EVENT_NAME, {
      import_source: 'gcom',
    });

    let dashboardId;
    const match = /(^\d+$)|dashboards\/(\d+)/.exec(formData.gcomDashboard);
    if (match && match[1]) {
      dashboardId = match[1];
    } else if (match && match[2]) {
      dashboardId = match[2];
    }

    if (dashboardId) {
      this.props.fetchGcomDashboard(dashboardId);
    }
  };

  renderImportForm() {
    const styles = importStyles(this.props.theme);

    return (
      <>
        <div className={styles.option}>
          <FileUpload accept="application/json" onFileUpload={this.onFileUpload}>
            上传JSON文件
          </FileUpload>
        </div>
        <div className={styles.option}>
          <Form onSubmit={this.getGcomDashboard} defaultValues={{ gcomDashboard: '' }}>
            {({ register, errors }) => (
              <Field
                label="通过grafana.com导入"
                invalid={!!errors.gcomDashboard}
                error={errors.gcomDashboard && errors.gcomDashboard.message}
              >
                <Input
                  id="url-input"
                  placeholder="Grafana.com 仪表盘URL或ID"
                  type="text"
                  {...register('gcomDashboard', {
                    required: '需要一个Grafana仪表板URL或ID',
                    validate: validateGcomDashboard,
                  })}
                  addonAfter={<Button type="submit">加载</Button>}
                />
              </Field>
            )}
          </Form>
        </div>
        <div className={styles.option}>
          <Form onSubmit={this.getDashboardFromJson} defaultValues={{ dashboardJson: '' }}>
            {({ register, errors }) => (
              <>
                <Field
                  label="通过面板JSON导入"
                  invalid={!!errors.dashboardJson}
                  error={errors.dashboardJson && errors.dashboardJson.message}
                >
                  <TextArea
                    {...register('dashboardJson', {
                      required: '需要一个仪表盘JSON模型',
                      validate: validateDashboardJson,
                    })}
                    data-testid={selectors.components.DashboardImportPage.textarea}
                    id="dashboard-json-textarea"
                    rows={10}
                  />
                </Field>
                <Button type="submit" data-testid={selectors.components.DashboardImportPage.submit}>
                  载入
                </Button>
              </>
            )}
          </Form>
        </div>
      </>
    );
  }

  pageNav: NavModelItem = {
    text: '导入仪表盘',
    subTitle: '从文件或Grafana.com导入仪表板"',
    breadcrumbs: [{ title: '仪表盘', url: 'dashboards' }],
  };

  render() {
    const { loadingState } = this.props;

    return (
      <Page navId="dashboards/browse" pageNav={this.pageNav}>
        <Page.Contents>
          {loadingState === LoadingState.Loading && (
            <VerticalGroup justify="center">
              <HorizontalGroup justify="center">
                <Spinner size={32} />
              </HorizontalGroup>
            </VerticalGroup>
          )}
          {[LoadingState.Error, LoadingState.NotStarted].includes(loadingState) && this.renderImportForm()}
          {loadingState === LoadingState.Done && <ImportDashboardOverview />}
        </Page.Contents>
      </Page>
    );
  }
}

const DashboardImportUnConnected = withTheme2(UnthemedDashboardImport);
const DashboardImport = connector(DashboardImportUnConnected);
DashboardImport.displayName = 'DashboardImport';
export default DashboardImport;

const importStyles = stylesFactory((theme: GrafanaTheme2) => {
  return {
    option: css`
      margin-bottom: ${theme.spacing(4)};
    `,
  };
});
