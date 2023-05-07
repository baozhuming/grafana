import { css } from '@emotion/css';
import pluralize from 'pluralize';
import React, { FC, useMemo, useState } from 'react';

import { GrafanaTheme2, dateTime, dateTimeFormat } from '@grafana/data';
import { Stack } from '@grafana/experimental';
import { Button, ConfirmModal, Modal, useStyles2, Badge, Icon } from '@grafana/ui';
import { contextSrv } from 'app/core/services/context_srv';
import { AlertManagerCortexConfig, Receiver } from 'app/plugins/datasource/alertmanager/types';
import { useDispatch, AccessControlAction, ContactPointsState, NotifiersState, ReceiversState } from 'app/types';

import { useGetContactPointsState } from '../../api/receiversApi';
import { Authorize } from '../../components/Authorize';
import { useUnifiedAlertingSelector } from '../../hooks/useUnifiedAlertingSelector';
import { deleteReceiverAction } from '../../state/actions';
import { getAlertTableStyles } from '../../styles/table';
import { getNotificationsPermissions } from '../../utils/access-control';
import { isReceiverUsed } from '../../utils/alertmanager';
import { isVanillaPrometheusAlertManagerDataSource } from '../../utils/datasource';
import { makeAMLink } from '../../utils/misc';
import { extractNotifierTypeCounts } from '../../utils/receivers';
import { DynamicTable, DynamicTableColumnProps, DynamicTableItemProps } from '../DynamicTable';
import { ProvisioningBadge } from '../Provisioning';
import { ActionIcon } from '../rules/ActionIcon';

import { ReceiversSection } from './ReceiversSection';

interface UpdateActionProps extends ActionProps {
  onClickDeleteReceiver: (receiverName: string) => void;
}

function UpdateActions({ permissions, alertManagerName, receiverName, onClickDeleteReceiver }: UpdateActionProps) {
  return (
    <>
      <Authorize actions={[permissions.update]}>
        <ActionIcon
          aria-label="Edit"
          data-testid="edit"
          to={makeAMLink(
            `/alerting/notifications/receivers/${encodeURIComponent(receiverName)}/edit`,
            alertManagerName
          )}
          tooltip="编辑连接点"
          icon="pen"
        />
      </Authorize>
      <Authorize actions={[permissions.delete]}>
        <ActionIcon onClick={() => onClickDeleteReceiver(receiverName)} tooltip="删除连接点" icon="trash-alt" />
      </Authorize>
    </>
  );
}
interface ActionProps {
  permissions: {
    read: AccessControlAction;
    create: AccessControlAction;
    update: AccessControlAction;
    delete: AccessControlAction;
  };
  alertManagerName: string;
  receiverName: string;
}

function ViewAction({ permissions, alertManagerName, receiverName }: ActionProps) {
  return (
    <Authorize actions={[permissions.update]}>
      <ActionIcon
        data-testid="view"
        to={makeAMLink(`/alerting/notifications/receivers/${encodeURIComponent(receiverName)}/edit`, alertManagerName)}
        tooltip="查看连接点"
        icon="file-alt"
      />
    </Authorize>
  );
}
interface ReceiverErrorProps {
  errorCount: number;
  errorDetail?: string;
  showErrorCount: boolean;
}

function ReceiverError({ errorCount, errorDetail, showErrorCount }: ReceiverErrorProps) {
  const text = showErrorCount ? `${errorCount} ${pluralize('error', errorCount)}` : '错误';
  return <Badge color="orange" icon="exclamation-triangle" text={text} tooltip={errorDetail ?? '错误'} />;
}
interface NotifierHealthProps {
  errorsByNotifier: number;
  errorDetail?: string;
  lastNotify: string;
}

function NotifierHealth({ errorsByNotifier, errorDetail, lastNotify }: NotifierHealthProps) {
  const noErrorsColor = isLastNotifyNullDate(lastNotify) ? 'orange' : 'green';
  const noErrorsText = isLastNotifyNullDate(lastNotify) ? '没有尝试' : '正常';
  return errorsByNotifier > 0 ? (
    <ReceiverError errorCount={errorsByNotifier} errorDetail={errorDetail} showErrorCount={false} />
  ) : (
    <Badge color={noErrorsColor} text={noErrorsText} tooltip="" />
  );
}

interface ReceiverHealthProps {
  errorsByReceiver: number;
  someWithNoAttempt: boolean;
}

function ReceiverHealth({ errorsByReceiver, someWithNoAttempt }: ReceiverHealthProps) {
  const noErrorsColor = someWithNoAttempt ? 'orange' : 'green';
  const noErrorsText = someWithNoAttempt ? '没有尝试' : '正常';
  return errorsByReceiver > 0 ? (
    <ReceiverError errorCount={errorsByReceiver} showErrorCount={true} />
  ) : (
    <Badge color={noErrorsColor} text={noErrorsText} tooltip="" />
  );
}

const useContactPointsState = (alertManagerName: string) => {
  const contactPointsState = useGetContactPointsState(alertManagerName);
  const receivers: ReceiversState = contactPointsState?.receivers ?? {};
  const errorStateAvailable = Object.keys(receivers).length > 0;
  return { contactPointsState, errorStateAvailable };
};
interface ReceiverItem {
  name: string;
  types: string[];
  provisioned?: boolean;
}

interface NotifierStatus {
  lastError?: null | string;
  lastNotify: string;
  lastNotifyDuration: string;
  type: string;
  sendResolved?: boolean;
}

type RowTableColumnProps = DynamicTableColumnProps<ReceiverItem>;
type RowItemTableProps = DynamicTableItemProps<ReceiverItem>;

type NotifierTableColumnProps = DynamicTableColumnProps<NotifierStatus>;
type NotifierItemTableProps = DynamicTableItemProps<NotifierStatus>;

interface NotifiersTableProps {
  notifiersState: NotifiersState;
}
const isLastNotifyNullDate = (lastNotify: string) => lastNotify === '0001-01-01T00:00:00.000Z';

function LastNotify({ lastNotifyDate }: { lastNotifyDate: string }) {
  if (isLastNotifyNullDate(lastNotifyDate)) {
    return <>{'-'}</>;
  } else {
    return (
      <Stack alignItems="center">
        <div>{`${dateTime(lastNotifyDate).locale('en').fromNow(true)} 前`}</div>
        <Icon name="clock-nine" />
        <div>{`${dateTimeFormat(lastNotifyDate, { format: 'YYYY-MM-DD HH:mm:ss' })}`}</div>
      </Stack>
    );
  }
}

const possibleNullDurations = ['', '0', '0ms', '0s', '0m', '0h', '0d', '0w', '0y'];
const durationIsNull = (duration: string) => possibleNullDurations.includes(duration);

function NotifiersTable({ notifiersState }: NotifiersTableProps) {
  function getNotifierColumns(): NotifierTableColumnProps[] {
    return [
      {
        id: 'health',
        label: '运行状况',
        renderCell: ({ data: { lastError, lastNotify } }) => {
          return (
            <NotifierHealth
              errorsByNotifier={lastError ? 1 : 0}
              errorDetail={lastError ?? undefined}
              lastNotify={lastNotify}
            />
          );
        },
        size: 0.5,
      },
      {
        id: 'name',
        label: '名字',
        renderCell: ({ data: { type }, id }) => <>{`${type}[${id}]`}</>,
        size: 1,
      },
      {
        id: 'lastNotify',
        label: '最后一次交付尝试',
        renderCell: ({ data: { lastNotify } }) => <LastNotify lastNotifyDate={lastNotify} />,
        size: 3,
      },
      {
        id: 'lastNotifyDuration',
        label: '最后通知持续时间',
        renderCell: ({ data: { lastNotify, lastNotifyDuration } }) => (
          <>{isLastNotifyNullDate(lastNotify) && durationIsNull(lastNotifyDuration) ? '-' : lastNotifyDuration}</>
        ),
        size: 1,
      },
      {
        id: 'sendResolved',
        label: '发生反馈',
        renderCell: ({ data: { sendResolved } }) => <>{String(Boolean(sendResolved))}</>,
        size: 1,
      },
    ];
  }
  const notifierRows: NotifierItemTableProps[] = Object.entries(notifiersState).flatMap((typeState) =>
    typeState[1].map((notifierStatus, index) => {
      return {
        id: index,
        data: {
          type: typeState[0],
          lastError: notifierStatus.lastNotifyAttemptError,
          lastNotify: notifierStatus.lastNotifyAttempt,
          lastNotifyDuration: notifierStatus.lastNotifyAttemptDuration,
          sendResolved: notifierStatus.sendResolved,
        },
      };
    })
  );

  return <DynamicTable items={notifierRows} cols={getNotifierColumns()} />;
}

interface Props {
  config: AlertManagerCortexConfig;
  alertManagerName: string;
}

export const ReceiversTable: FC<Props> = ({ config, alertManagerName }) => {
  const dispatch = useDispatch();
  const styles = useStyles2(getStyles);
  const isVanillaAM = isVanillaPrometheusAlertManagerDataSource(alertManagerName);
  const permissions = getNotificationsPermissions(alertManagerName);
  const grafanaNotifiers = useUnifiedAlertingSelector((state) => state.grafanaNotifiers);

  const { contactPointsState, errorStateAvailable } = useContactPointsState(alertManagerName);

  // receiver name slated for deletion. If this is set, a confirmation modal is shown. If user approves, this receiver is deleted
  const [receiverToDelete, setReceiverToDelete] = useState<string>();
  const [showCannotDeleteReceiverModal, setShowCannotDeleteReceiverModal] = useState(false);

  const onClickDeleteReceiver = (receiverName: string): void => {
    if (isReceiverUsed(receiverName, config)) {
      setShowCannotDeleteReceiverModal(true);
    } else {
      setReceiverToDelete(receiverName);
    }
  };

  const deleteReceiver = () => {
    if (receiverToDelete) {
      dispatch(deleteReceiverAction(receiverToDelete, alertManagerName));
    }
    setReceiverToDelete(undefined);
  };

  const rows: RowItemTableProps[] = useMemo(
    () =>
      config.alertmanager_config.receivers?.map((receiver: Receiver) => ({
        id: receiver.name,
        data: {
          name: receiver.name,
          types: Object.entries(extractNotifierTypeCounts(receiver, grafanaNotifiers.result ?? [])).map(
            ([type, count]) => {
              if (count > 1) {
                return `${type} (${count})`;
              }
              return type;
            }
          ),
          provisioned: receiver.grafana_managed_receiver_configs?.some((receiver) => receiver.provenance),
        },
      })) ?? [],
    [config, grafanaNotifiers.result]
  );
  const columns = useGetColumns(
    alertManagerName,
    errorStateAvailable,
    contactPointsState,
    onClickDeleteReceiver,
    permissions,
    isVanillaAM
  );

  return (
    <ReceiversSection
      className={styles.section}
      title="连接点"
      description="定义通知将发送到何处，例如电子邮件或Slack"
      showButton={!isVanillaAM && contextSrv.hasPermission(permissions.create)}
      addButtonLabel="创建连接点"
      addButtonTo={makeAMLink('/alerting/notifications/receivers/new', alertManagerName)}
    >
      <DynamicTable
        items={rows}
        cols={columns}
        isExpandable={errorStateAvailable}
        renderExpandedContent={
          errorStateAvailable
            ? ({ data: { name } }) => (
                <NotifiersTable notifiersState={contactPointsState?.receivers[name]?.notifiers ?? {}} />
              )
            : undefined
        }
      />
      {!!showCannotDeleteReceiverModal && (
        <Modal isOpen={true} title="无法删除连接点" onDismiss={() => setShowCannotDeleteReceiverModal(false)}>
          <p>由于联系点在多个策略中使用，因此无法删除联系点，请先更新或删除这些策略</p>
          <Modal.ButtonRow>
            <Button variant="secondary" onClick={() => setShowCannotDeleteReceiverModal(false)} fill="outline">
              关闭
            </Button>
          </Modal.ButtonRow>
        </Modal>
      )}
      {!!receiverToDelete && (
        <ConfirmModal
          isOpen={true}
          title="删除连接点"
          body={`确认删除联系点 "${receiverToDelete}"?`}
          confirmText="是的，删除"
          onConfirm={deleteReceiver}
          onDismiss={() => setReceiverToDelete(undefined)}
        />
      )}
    </ReceiversSection>
  );
};
const errorsByReceiver = (contactPointsState: ContactPointsState, receiverName: string) =>
  contactPointsState?.receivers[receiverName]?.errorCount ?? 0;

const someNotifiersWithNoAttempt = (contactPointsState: ContactPointsState, receiverName: string) => {
  const notifiers = Object.values(contactPointsState?.receivers[receiverName]?.notifiers ?? {});
  const hasSomeWitNoAttempt =
    notifiers.length === 0 || notifiers.flat().some((status) => isLastNotifyNullDate(status.lastNotifyAttempt));
  return hasSomeWitNoAttempt;
};

function useGetColumns(
  alertManagerName: string,
  errorStateAvailable: boolean,
  contactPointsState: ContactPointsState | undefined,
  onClickDeleteReceiver: (receiverName: string) => void,
  permissions: {
    read: AccessControlAction;
    create: AccessControlAction;
    update: AccessControlAction;
    delete: AccessControlAction;
  },
  isVanillaAM: boolean
): RowTableColumnProps[] {
  const tableStyles = useStyles2(getAlertTableStyles);
  const baseColumns: RowTableColumnProps[] = [
    {
      id: 'name',
      label: '连接点名称',
      renderCell: ({ data: { name, provisioned } }) => (
        <>
          {name} {provisioned && <ProvisioningBadge />}
        </>
      ),
      size: 1,
    },
    {
      id: 'type',
      label: '类型',
      renderCell: ({ data: { types } }) => <>{types.join(', ')}</>,
      size: 1,
    },
  ];
  const healthColumn: RowTableColumnProps = {
    id: 'health',
    label: '运行状况',
    renderCell: ({ data: { name } }) => {
      return (
        contactPointsState && (
          <ReceiverHealth
            errorsByReceiver={errorsByReceiver(contactPointsState, name)}
            someWithNoAttempt={someNotifiersWithNoAttempt(contactPointsState, name)}
          />
        )
      );
    },
    size: 1,
  };

  return [
    ...baseColumns,
    ...(errorStateAvailable ? [healthColumn] : []),
    {
      id: 'actions',
      label: '操作',
      renderCell: ({ data: { provisioned, name } }) => (
        <Authorize actions={[permissions.update, permissions.delete]}>
          <div className={tableStyles.actionsCell}>
            {!isVanillaAM && !provisioned && (
              <UpdateActions
                permissions={permissions}
                alertManagerName={alertManagerName}
                receiverName={name}
                onClickDeleteReceiver={onClickDeleteReceiver}
              />
            )}
            {(isVanillaAM || provisioned) && (
              <ViewAction permissions={permissions} alertManagerName={alertManagerName} receiverName={name} />
            )}
          </div>
        </Authorize>
      ),
      size: '100px',
    },
  ];
}

const getStyles = (theme: GrafanaTheme2) => ({
  section: css`
    margin-top: ${theme.spacing(4)};
  `,
  warning: css`
    color: ${theme.colors.warning.text};
  `,
  countMessage: css``,
});
