import React, { useCallback } from 'react';
import { useAsync } from 'react-use';

import { NavModelItem } from '@grafana/data';
import { withErrorBoundary } from '@grafana/ui';
import { GrafanaRouteComponentProps } from 'app/core/navigation/types';
import { useDispatch } from 'app/types';

import { AlertWarning } from './AlertWarning';
import { ExistingRuleEditor } from './ExistingRuleEditor';
import { AlertingPageWrapper } from './components/AlertingPageWrapper';
import { AlertRuleForm } from './components/rule-editor/AlertRuleForm';
import { fetchRulesSourceBuildInfoAction } from './state/actions';
import { useRulesAccess } from './utils/accessControlHooks';
import * as ruleId from './utils/rule-id';

type RuleEditorProps = GrafanaRouteComponentProps<{ id?: string }>;

const defaultPageNav: Partial<NavModelItem> = {
  icon: 'bell',
  id: 'alert-rule-view',
  breadcrumbs: [{ title: '警报规则', url: 'alerting/list' }],
};

const getPageNav = (state: 'edit' | 'add') => {
  if (state === 'edit') {
    return { ...defaultPageNav, id: 'alert-rule-edit', text: '编辑规则' };
  } else if (state === 'add') {
    return { ...defaultPageNav, id: 'alert-rule-add', text: '添加规则' };
  }
  return undefined;
};

const RuleEditor = ({ match }: RuleEditorProps) => {
  const dispatch = useDispatch();
  const { id } = match.params;
  const identifier = ruleId.tryParse(id, true);

  const { loading = true } = useAsync(async () => {
    if (identifier) {
      await dispatch(fetchRulesSourceBuildInfoAction({ rulesSourceName: identifier.ruleSourceName }));
    }
  }, [dispatch]);

  const { canCreateGrafanaRules, canCreateCloudRules, canEditRules } = useRulesAccess();

  const getContent = useCallback(() => {
    if (loading) {
      return;
    }

    if (!identifier && !canCreateGrafanaRules && !canCreateCloudRules) {
      return <AlertWarning title="无法创建规则">对不起!不允许创建规则</AlertWarning>;
    }

    if (identifier && !canEditRules(identifier.ruleSourceName)) {
      return <AlertWarning title="无法编辑规则">对不起!不允许编辑规则</AlertWarning>;
    }

    if (identifier) {
      return <ExistingRuleEditor key={id} identifier={identifier} />;
    }

    return <AlertRuleForm />;
  }, [canCreateCloudRules, canCreateGrafanaRules, canEditRules, id, identifier, loading]);

  return (
    <AlertingPageWrapper isLoading={loading} pageId="alert-list" pageNav={getPageNav(identifier ? 'edit' : 'add')}>
      {getContent()}
    </AlertingPageWrapper>
  );
};

export default withErrorBoundary(RuleEditor, { style: 'page' });
