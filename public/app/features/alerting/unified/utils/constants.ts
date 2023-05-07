export const RULER_NOT_SUPPORTED_MSG = 'ruler not supported';

export const RULE_LIST_POLL_INTERVAL_MS = 20000;

export const ALERTMANAGER_NAME_QUERY_KEY = 'alertmanager';
export const ALERTMANAGER_NAME_LOCAL_STORAGE_KEY = 'alerting-alertmanager';
export const SILENCES_POLL_INTERVAL_MS = 20000;
export const NOTIFICATIONS_POLL_INTERVAL_MS = 20000;
export const CONTACT_POINTS_STATE_INTERVAL_MS = 20000;

export const TIMESERIES = 'timeseries';
export const TABLE = 'table';
export const STAT = 'stat';

export enum Annotation {
  description = 'description',
  summary = 'summary',
  runbookURL = 'runbook_url',
  alertId = '__alertId__',
  dashboardUID = '__dashboardUid__',
  panelID = '__panelId__',
}

export const annotationLabels: Record<Annotation, string> = {
  [Annotation.description]: '说明',
  [Annotation.summary]: '概要',
  [Annotation.runbookURL]: '运行手册URL',
  [Annotation.dashboardUID]: '仪表盘UID',
  [Annotation.panelID]: '面板ID',
  [Annotation.alertId]: '报警ID',
};
