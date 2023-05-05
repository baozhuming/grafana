import { DataFrame, FieldConfigSource, PanelData, PanelPlugin } from '@grafana/data';

import { DashboardModel, PanelModel } from '../../state';

export interface PanelEditorTab {
  id: string;
  text: string;
  active: boolean;
  icon: string;
}

export enum PanelEditorTabId {
  Query = 'query',
  Transform = 'transform',
  Visualize = 'visualize',
  Alert = 'alert',
}

export enum DisplayMode {
  Fill = 0,
  Fit = 1,
  Exact = 2,
}

export enum PanelEditTableToggle {
  Off = 0,
  Table = 1,
}

export const displayModes = [
  { value: DisplayMode.Fill, label: '填充', description: '使用所有可用空间' },
  { value: DisplayMode.Exact, label: '收缩', description: '制作与仪表板相同的大小' },
];

export const panelEditTableModes = [
  {
    value: PanelEditTableToggle.Off,
    label: '可视化',
    description: '使用选定的可视化显示',
  },
  { value: PanelEditTableToggle.Table, label: '表格', description: '以表格形式显示原始数据' },
];

/** @internal */
export interface Props {
  plugin: PanelPlugin;
  config: FieldConfigSource;
  onChange: (config: FieldConfigSource) => void;
  /* Helpful for IntelliSense */
  data: DataFrame[];
}

export interface OptionPaneRenderProps {
  panel: PanelModel;
  plugin: PanelPlugin;
  data?: PanelData;
  dashboard: DashboardModel;
  instanceState: any;
  onPanelConfigChange: (configKey: keyof PanelModel, value: any) => void;
  onPanelOptionsChanged: (options: any) => void;
  onFieldConfigsChange: (config: FieldConfigSource) => void;
}

export interface OptionPaneItemOverrideInfo {
  type: 'data' | 'rule';
  onClick?: () => void;
  tooltip: string;
  description: string;
}

export enum VisualizationSelectPaneTab {
  Visualizations,
  LibraryPanels,
  Suggestions,
}
