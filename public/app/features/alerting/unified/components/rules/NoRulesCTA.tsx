import React from 'react';

import { logInfo } from '@grafana/runtime';
import { CallToActionCard } from '@grafana/ui';
import EmptyListCTA from 'app/core/components/EmptyListCTA/EmptyListCTA';

import { LogMessages } from '../../Analytics';
import { useRulesAccess } from '../../utils/accessControlHooks';

export const NoRulesSplash = () => {
  const { canCreateGrafanaRules, canCreateCloudRules } = useRulesAccess();

  if (canCreateGrafanaRules || canCreateCloudRules) {
    return (
      <EmptyListCTA
        title="您还没有创建任何警报规则"
        buttonIcon="bell"
        buttonLink={'alerting/new'}
        buttonTitle="创建警报规则"
        proTip="您还可以从现有面板和查询中创建警报规则"
        proTipLink="https://grafana.com/docs/"
        proTipLinkTitle="了解更多"
        proTipTarget="_blank"
        onClick={() => logInfo(LogMessages.alertRuleFromScratch)}
      />
    );
  }
  return <CallToActionCard message="No rules exist yet." callToActionElement={<div />} />;
};
