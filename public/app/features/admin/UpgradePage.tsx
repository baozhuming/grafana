import { css } from '@emotion/css';
import React from 'react';
import { connect } from 'react-redux';

import { GrafanaTheme2, NavModel } from '@grafana/data';
import { LinkButton, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import { getNavModel } from '../../core/selectors/navModel';
import { StoreState } from '../../types';

import { LicenseChrome } from './LicenseChrome';
import { ServerStats } from './ServerStats';

interface Props {
  navModel: NavModel;
}

export function UpgradePage({ navModel }: Props) {
  return (
    <Page navModel={navModel}>
      <Page.Contents>
        <ServerStats />
        <UpgradeInfo editionNotice="您正在运行的是开源版本的Grafana，您必须安装企业版才能启用企业功能" />
      </Page.Contents>
    </Page>
  );
}

const titleStyles = { fontWeight: 500, fontSize: '26px', lineHeight: '123%' };

interface UpgradeInfoProps {
  editionNotice?: string;
}

export const UpgradeInfo = ({ editionNotice }: UpgradeInfoProps) => {
  const styles = useStyles2(getStyles);

  return (
    <>
      <h2 className={styles.title}>企业版许可</h2>
      <LicenseChrome header="Grafana企业版" subheader="免费试用" editionNotice={editionNotice}>
        <div className={styles.column}>
          <FeatureInfo />
          <ServiceInfo />
        </div>
      </LicenseChrome>
    </>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    column: css`
      display: grid;
      grid-template-columns: 100%;
      column-gap: 20px;
      row-gap: 40px;

      @media (min-width: 1050px) {
        grid-template-columns: 50% 50%;
      }
    `,
    title: css`
      margin: ${theme.spacing(4)} 0;
    `,
  };
};

const GetEnterprise = () => {
  return (
    <div style={{ marginTop: '40px', marginBottom: '30px' }}>
      <h2 style={titleStyles}>获取Grafana企业版</h2>
      <CallToAction />
      <p style={{ paddingTop: '12px' }}>你可以免费试用30天。我们会在试用期结束前5天提醒您</p>
    </div>
  );
};

const CallToAction = () => {
  return (
    <LinkButton
      variant="primary"
      size="lg"
      href="https://grafana.com/contact?about=grafana-enterprise&utm_source=grafana-upgrade-page"
    >
      联系我们并获得免费试用
    </LinkButton>
  );
};

const ServiceInfo = () => {
  return (
    <div>
      <h4>当前系统的功能</h4>

      <List>
        <Item title="企业插件" image="public/img/licensing/plugin_enterprise.svg" />
        <Item title="重要的 SLA: 2 小时" image="public/img/licensing/sla.svg" />
        <Item title="专家全年支持" image="public/img/licensing/customer_support.svg">
          24 x 7 x 365 支持渠道
          <List nested={true}>
            <Item title="邮件" />
            <Item title="私有Slack通道" />
            <Item title="电话" />
          </List>
        </Item>
        <Item title="手把手支持" image="public/img/licensing/handinhand_support.svg">
          在升级过程中
        </Item>
      </List>

      <div style={{ marginTop: '20px' }}>
        <strong>还包括:</strong>
        <br />
        赔偿，与Grafana实验室合作确定未来的优先级，并接受Grafana核心团队的培训
      </div>

      <GetEnterprise />
    </div>
  );
};

const FeatureInfo = () => {
  return (
    <div style={{ paddingRight: '11px' }}>
      <h4>增强功能</h4>
      <FeatureListing />
    </div>
  );
};

const FeatureListing = () => {
  return (
    <List>
      <Item title="数据源权限" />
      <Item title="报表" />
      <Item title="SAML校验" />
      <Item title="增强的LDAP集成" />
      <Item title="团队同步">LDAP, GitHub OAuth, Auth Proxy, Okta</Item>
      <Item title="贴牌" />
      <Item title="审计" />
      <Item title="运行中更新设置" />
      <Item title="Grafana使用洞察">
        <List nested={true}>
          <Item title="根据搜索中的流行程度对仪表盘进行排序" />
          <Item title="查找未使用的仪表盘" />
          <Item title="仪表盘使用统计抽屉" />
          <Item title="仪表盘状态指示器" />
        </List>
      </Item>
      <Item title="企业插件">
        <List nested={true}>
          <Item title="Oracle" />
          <Item title="Splunk" />
          <Item title="Service Now" />
          <Item title="Dynatrace" />
          <Item title="New Relic" />
          <Item title="DataDog" />
          <Item title="AppDynamics" />
          <Item title="SAP HANA®" />
          <Item title="Gitlab" />
          <Item title="Honeycomb" />
          <Item title="Jira" />
          <Item title="MongoDB" />
          <Item title="Salesforce" />
          <Item title="Snowflake" />
          <Item title="Wavefront" />
        </List>
      </Item>
    </List>
  );
};

interface ListProps {
  nested?: boolean;
}

const List = ({ children, nested }: React.PropsWithChildren<ListProps>) => {
  const listStyle = css`
    display: flex;
    flex-direction: column;
    padding-top: 8px;

    > div {
      margin-bottom: ${nested ? 0 : 8}px;
    }
  `;

  return <div className={listStyle}>{children}</div>;
};

interface ItemProps {
  title: string;
  image?: string;
}

const Item = ({ children, title, image }: React.PropsWithChildren<ItemProps>) => {
  const imageUrl = image ? image : 'public/img/licensing/checkmark.svg';
  const itemStyle = css`
    display: flex;

    > img {
      display: block;
      height: 22px;
      flex-grow: 0;
      padding-right: 12px;
    }
  `;
  const titleStyle = css`
    font-weight: 500;
    line-height: 1.7;
  `;

  return (
    <div className={itemStyle}>
      <img src={imageUrl} alt="" />
      <div>
        <div className={titleStyle}>{title}</div>
        {children}
      </div>
    </div>
  );
};

const mapStateToProps = (state: StoreState) => ({
  navModel: getNavModel(state.navIndex, 'upgrading'),
});

export default connect(mapStateToProps)(UpgradePage);
