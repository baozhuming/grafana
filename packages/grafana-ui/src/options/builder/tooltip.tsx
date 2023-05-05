import { PanelOptionsEditorBuilder } from '@grafana/data';
import { OptionsWithTooltip, TooltipDisplayMode, SortOrder } from '@grafana/schema';

export function addTooltipOptions<T extends OptionsWithTooltip>(
  builder: PanelOptionsEditorBuilder<T>,
  singleOnly = false
) {
  const category = ['Tooltip'];
  const modeOptions = singleOnly
    ? [
        { value: TooltipDisplayMode.Single, label: '单个' },
        { value: TooltipDisplayMode.None, label: '隐藏' },
      ]
    : [
        { value: TooltipDisplayMode.Single, label: '单个' },
        { value: TooltipDisplayMode.Multi, label: '全部' },
        { value: TooltipDisplayMode.None, label: '隐藏' },
      ];

  const sortOptions = [
    { value: SortOrder.None, label: '无' },
    { value: SortOrder.Ascending, label: '升序' },
    { value: SortOrder.Descending, label: '降序' },
  ];

  builder
    .addRadio({
      path: 'tooltip.mode',
      name: '工具提示模式',
      category,
      defaultValue: 'single',
      settings: {
        options: modeOptions,
      },
    })
    .addRadio({
      path: 'tooltip.sort',
      name: '值排序顺序',
      category,
      defaultValue: SortOrder.None,
      showIf: (options: T) => options.tooltip.mode === TooltipDisplayMode.Multi,
      settings: {
        options: sortOptions,
      },
    });
}
