import { css } from '@emotion/css';
import classNames from 'classnames';
import React, { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';

import { GrafanaTheme2 } from '@grafana/data';
import { Stack } from '@grafana/experimental';
import { useStyles2, Field, Input, InputControl, Label, Tooltip, Icon } from '@grafana/ui';
import { FolderPickerFilter } from 'app/core/components/Select/FolderPicker';
import { contextSrv } from 'app/core/services/context_srv';
import { DashboardSearchHit } from 'app/features/search/types';
import { AccessControlAction } from 'app/types';

import { RuleForm, RuleFormType, RuleFormValues } from '../../types/rule-form';

import AnnotationsField from './AnnotationsField';
import { GroupAndNamespaceFields } from './GroupAndNamespaceFields';
import { RuleEditorSection } from './RuleEditorSection';
import { RuleFolderPicker, Folder, containsSlashes } from './RuleFolderPicker';
import { checkForPathSeparator } from './util';

const recordingRuleNameValidationPattern = {
  message:
    'Recording rule name must be valid metric name. It may only contain letters, numbers, and colons. It may not contain whitespace.',
  value: /^[a-zA-Z_:][a-zA-Z0-9_:]*$/,
};

interface DetailsStepProps {
  initialFolder: RuleForm | null;
}

export const DetailsStep = ({ initialFolder }: DetailsStepProps) => {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<RuleFormValues & { location?: string }>();

  const styles = useStyles2(getStyles);

  const ruleFormType = watch('type');
  const dataSourceName = watch('dataSourceName');
  const type = watch('type');

  const folderFilter = useRuleFolderFilter(initialFolder);

  return (
    <RuleEditorSection
      stepNo={type === RuleFormType.cloudRecording ? 2 : 3}
      title={type === RuleFormType.cloudRecording ? '为录制规则添加详细信息' : '为您的警报添加详细信息'}
      description={
        type === RuleFormType.cloudRecording
          ? '添加标签可以帮助您更好地管理规则'
          : '写一个摘要并添加标签来帮助你更好地管理你的提醒'
      }
    >
      <Field
        className={styles.formInput}
        label="规则名称"
        error={errors?.name?.message}
        invalid={!!errors.name?.message}
      >
        <Input
          id="name"
          {...register('name', {
            required: { value: true, message: '必须输入警报名称' },
            pattern: ruleFormType === RuleFormType.cloudRecording ? recordingRuleNameValidationPattern : undefined,
            validate: {
              pathSeparator: (value: string) => {
                // we use the alert rule name as the "groupname" for Grafana managed alerts, so we can't allow path separators
                if (ruleFormType === RuleFormType.grafana) {
                  return checkForPathSeparator(value);
                }

                return true;
              },
            },
          })}
        />
      </Field>

      {(ruleFormType === RuleFormType.cloudRecording || ruleFormType === RuleFormType.cloudAlerting) &&
        dataSourceName && <GroupAndNamespaceFields rulesSourceName={dataSourceName} />}

      {ruleFormType === RuleFormType.grafana && (
        <div className={classNames([styles.flexRow, styles.alignBaseline])}>
          <Field
            label={
              <Label htmlFor="folder" description={'选择一个文件夹来存储您的规则'}>
                <Stack gap={0.5}>
                  文件夹
                  <Tooltip
                    placement="top"
                    content={
                      <div>
                        每个文件夹具有唯一的文件夹权限，当您在一个文件夹中存储多个规则时，将为这些规则分配文件夹访问权限
                      </div>
                    }
                  >
                    <Icon name="info-circle" size="xs" />
                  </Tooltip>
                </Stack>
              </Label>
            }
            className={styles.formInput}
            error={errors.folder?.message}
            invalid={!!errors.folder?.message}
            data-testid="folder-picker"
          >
            <InputControl
              render={({ field: { ref, ...field } }) => (
                <RuleFolderPicker
                  inputId="folder"
                  {...field}
                  enableCreateNew={contextSrv.hasPermission(AccessControlAction.FoldersCreate)}
                  enableReset={true}
                  filter={folderFilter}
                  dissalowSlashes={true}
                />
              )}
              name="folder"
              rules={{
                required: { value: true, message: '请选择一个文件夹' },
                validate: {
                  pathSeparator: (folder: Folder) => checkForPathSeparator(folder.title),
                },
              }}
            />
          </Field>
          <Field
            label="组"
            data-testid="group-picker"
            description="同一组中的规则在相同的时间间隔后进行报警"
            className={styles.formInput}
            error={errors.group?.message}
            invalid={!!errors.group?.message}
          >
            <Input
              id="group"
              {...register('group', {
                required: { value: true, message: '必须输入组名' },
                validate: {
                  pathSeparator: (group_: string) => checkForPathSeparator(group_),
                },
              })}
            />
          </Field>
        </div>
      )}
      {type !== RuleFormType.cloudRecording && <AnnotationsField />}
    </RuleEditorSection>
  );
};

const useRuleFolderFilter = (existingRuleForm: RuleForm | null) => {
  const isSearchHitAvailable = useCallback(
    (hit: DashboardSearchHit) => {
      const rbacDisabledFallback = contextSrv.hasEditPermissionInFolders;

      const canCreateRuleInFolder = contextSrv.hasAccessInMetadata(
        AccessControlAction.AlertingRuleCreate,
        hit,
        rbacDisabledFallback
      );

      const canUpdateInCurrentFolder =
        existingRuleForm &&
        hit.folderId === existingRuleForm.id &&
        contextSrv.hasAccessInMetadata(AccessControlAction.AlertingRuleUpdate, hit, rbacDisabledFallback);
      return canCreateRuleInFolder || canUpdateInCurrentFolder;
    },
    [existingRuleForm]
  );

  return useCallback<FolderPickerFilter>(
    (folderHits) =>
      folderHits
        .filter(isSearchHitAvailable)
        .filter((value: DashboardSearchHit) => !containsSlashes(value.title ?? '')),
    [isSearchHitAvailable]
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  alignBaseline: css`
    align-items: baseline;
    margin-bottom: ${theme.spacing(3)};
  `,
  formInput: css`
    width: 275px;

    & + & {
      margin-left: ${theme.spacing(3)};
    }
  `,
  flexRow: css`
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: end;
  `,
});
