import { PanelOptionsEditorBuilder } from '@grafana/data';
import { OptionsWithTextFormatting } from '@grafana/schema';

/**
 * Adds common text control options to a visualization options
 * @param builder
 * @param withTitle
 * @public
 */
export function addTextSizeOptions<T extends OptionsWithTextFormatting>(
  builder: PanelOptionsEditorBuilder<T>,
  withTitle = true
) {
  if (withTitle) {
    builder.addNumberInput({
      path: 'text.titleSize',
      category: ['Text size'],
      name: '标题',
      settings: {
        placeholder: 'Auto',
        integer: false,
        min: 1,
        max: 200,
      },
      defaultValue: undefined,
    });
  }

  builder.addNumberInput({
    path: 'text.valueSize',
    category: ['Text size'],
    name: '值',
    settings: {
      placeholder: 'Auto',
      integer: false,
      min: 1,
      max: 200,
    },
    defaultValue: undefined,
  });
}
