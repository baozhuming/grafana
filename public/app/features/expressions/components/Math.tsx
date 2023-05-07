import { css } from '@emotion/css';
import React, { ChangeEvent, FC } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Stack } from '@grafana/experimental';
import { Icon, InlineField, InlineLabel, TextArea, useStyles2 } from '@grafana/ui';
import { HoverCard } from 'app/features/alerting/unified/components/HoverCard';

import { ExpressionQuery } from '../types';

interface Props {
  labelWidth: number | 'auto';
  query: ExpressionQuery;
  onChange: (query: ExpressionQuery) => void;
  onRunQuery: () => void;
}

const mathPlaceholder =
  '对一个或多个查询进行数学运算，您通过${refId}引用变量值，例如：$A, $B, $C等\n' + ' 两个变量值的和: $A + $B > 10';

export const Math: FC<Props> = ({ labelWidth, onChange, query, onRunQuery }) => {
  const onExpressionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...query, expression: event.target.value });
  };

  const styles = useStyles2(getStyles);

  const executeQuery = () => {
    if (query.expression) {
      onRunQuery();
    }
  };

  return (
    <Stack direction="row">
      <InlineField
        label={
          <InlineLabel width="auto">
            <HoverCard
              content={
                <div className={styles.documentationContainer}>
                  <header className={styles.documentationHeader}>
                    <Icon name="book-open" /> Math operator
                  </header>
                  <div>
                    对一个或多个查询进行数学运算，您通过{'${refId}'}引用变量值，例如：$A, $B, $C等
                    <br />
                    例如: <code>$A + $B</code>
                  </div>
                  <header className={styles.documentationHeader}>Available Math functions</header>
                  <div className={styles.documentationFunctions}>
                    <DocumentedFunction name="abs" description="返回其参数的绝对值，该参数可以是数字或序列" />
                    <DocumentedFunction
                      name="is_inf"
                      description="对于Inf值(负或正)返回1，对于其他值返回0。它可以对级数或标量值进行运算"
                    />
                    <DocumentedFunction
                      name="is_nan"
                      description="NaN值返回1，其他值返回0。它可以对级数或标量值进行运算"
                    />
                    <DocumentedFunction
                      name="is_null"
                      description="空值返回1，其他值返回0。它可以对级数或标量值进行运算"
                    />
                    <DocumentedFunction
                      name="is_number"
                      description="对于所有实数返回1，对于非数字返回0。它可以对级数或标量值进行运算"
                    />
                    <DocumentedFunction name="log" description="返回其参数的自然对数，该参数可以是数字或级数" />
                    <DocumentedFunction
                      name="inf, infn, nan, and null"
                      description="inf(表示正无穷)、inf(表示负无穷)、nan和null函数都返回与其名称匹配的单个标量值"
                    />
                    <DocumentedFunction name="round" description="返回一个舍入整数值，它可以对级数或标量值进行运算" />
                    <DocumentedFunction
                      name="ceil"
                      description="将数字四舍五入到最接近的整数值，它可以对级数或标量值进行运算"
                    />
                    <DocumentedFunction
                      name="floor"
                      description="将数字舍入到最接近的整数值，它可以对级数或标量值进行运算"
                    />
                  </div>
                  <div>
                    详见文档{' '}
                    <a
                      className={styles.documentationLink}
                      target="_blank"
                      href="https://grafana.com/docs/grafana/latest/panels/query-a-data-source/use-expressions-to-manipulate-data/about-expressions/#math"
                      rel="noreferrer"
                    >
                      <Icon size="xs" name="external-link-alt" /> 数学表达式
                    </a>
                  </div>
                </div>
              }
            >
              <span>
                表达式 <Icon name="info-circle" />
              </span>
            </HoverCard>
          </InlineLabel>
        }
        labelWidth={labelWidth}
        grow={true}
        shrink={true}
      >
        <TextArea
          value={query.expression}
          onChange={onExpressionChange}
          rows={1}
          placeholder={mathPlaceholder}
          onBlur={executeQuery}
          style={{ minWidth: 250, lineHeight: '26px', minHeight: 32 }}
        />
      </InlineField>
    </Stack>
  );
};

interface DocumentedFunctionProps {
  name: string;
  description: React.ReactNode;
}
const DocumentedFunction = ({ name, description }: DocumentedFunctionProps) => {
  const styles = useStyles2(getDocumentedFunctionStyles);

  return (
    <>
      <span className={styles.name}>{name}</span>
      <span className={styles.description}>{description}</span>
    </>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  documentationHeader: css`
    font-size: ${theme.typography.h5.fontSize};
    font-weight: ${theme.typography.h5.fontWeight};
  `,
  documentationLink: css`
    color: ${theme.colors.text.link};
  `,
  documentationContainer: css`
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: ${theme.spacing(2)};

    padding: ${theme.spacing(1)} ${theme.spacing(2)};
  `,
  documentationFunctions: css`
    display: grid;
    grid-template-columns: max-content auto;
    column-gap: ${theme.spacing(2)};
  `,
});

const getDocumentedFunctionStyles = (theme: GrafanaTheme2) => ({
  name: css`
    font-weight: ${theme.typography.fontWeightBold};
  `,
  description: css`
    font-size: ${theme.typography.bodySmall.fontSize};
    color: ${theme.colors.text.disabled};
  `,
});
