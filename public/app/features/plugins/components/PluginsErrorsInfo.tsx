import { css } from '@emotion/css';
import React from 'react';

import { GrafanaTheme2, PluginErrorCode, PluginSignatureStatus } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { HorizontalGroup, InfoBox, List, PluginSignatureBadge, useStyles2 } from '@grafana/ui';

import { useGetErrors, useFetchStatus } from '../admin/state/hooks';

export function PluginsErrorsInfo() {
  const errors = useGetErrors();
  const { isLoading } = useFetchStatus();
  const styles = useStyles2(getStyles);

  if (isLoading || errors.length === 0) {
    return null;
  }

  return (
    <InfoBox
      aria-label={selectors.pages.PluginsList.signatureErrorNotice}
      severity="warning"
      urlTitle="阅读更多关于插件签名的信息"
      url="https://grafana.com/docs/grafana/latest/plugins/plugin-signatures/"
    >
      <div>
        <p>在插件初始化期间发现了未签名的插件，Grafana实验室不能保证这些插件的完整性，我们建议只使用签名插件</p>
        以下插件已禁用，未显示在下面的列表中:
        <List
          items={errors}
          className={styles.list}
          renderItem={(error) => (
            <div className={styles.wrapper}>
              <HorizontalGroup spacing="sm" justify="flex-start" align="center">
                <strong>{error.pluginId}</strong>
                <PluginSignatureBadge
                  status={mapPluginErrorCodeToSignatureStatus(error.errorCode)}
                  className={styles.badge}
                />
              </HorizontalGroup>
            </div>
          )}
        />
      </div>
    </InfoBox>
  );
}

function mapPluginErrorCodeToSignatureStatus(code: PluginErrorCode) {
  switch (code) {
    case PluginErrorCode.invalidSignature:
      return PluginSignatureStatus.invalid;
    case PluginErrorCode.missingSignature:
      return PluginSignatureStatus.missing;
    case PluginErrorCode.modifiedSignature:
      return PluginSignatureStatus.modified;
    default:
      return PluginSignatureStatus.missing;
  }
}

function getStyles(theme: GrafanaTheme2) {
  return {
    list: css({
      listStyleType: 'circle',
    }),
    wrapper: css({
      marginTop: theme.spacing(1),
    }),
    badge: css({
      marginTop: 0,
    }),
  };
}
