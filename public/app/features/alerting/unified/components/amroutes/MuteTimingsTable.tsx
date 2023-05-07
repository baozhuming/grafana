import { css } from '@emotion/css';
import React, { FC, useMemo, useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { IconButton, LinkButton, Link, useStyles2, ConfirmModal } from '@grafana/ui';
import { contextSrv } from 'app/core/services/context_srv';
import { AlertManagerCortexConfig, MuteTimeInterval, TimeInterval } from 'app/plugins/datasource/alertmanager/types';
import { useDispatch } from 'app/types';

import { Authorize } from '../../components/Authorize';
import { useUnifiedAlertingSelector } from '../../hooks/useUnifiedAlertingSelector';
import { deleteMuteTimingAction } from '../../state/actions';
import { getNotificationsPermissions } from '../../utils/access-control';
import {
  getTimeString,
  getWeekdayString,
  getDaysOfMonthString,
  getMonthsString,
  getYearsString,
} from '../../utils/alertmanager';
import { makeAMLink } from '../../utils/misc';
import { AsyncRequestState, initialAsyncRequestState } from '../../utils/redux';
import { DynamicTable, DynamicTableItemProps, DynamicTableColumnProps } from '../DynamicTable';
import { EmptyAreaWithCTA } from '../EmptyAreaWithCTA';
import { ProvisioningBadge } from '../Provisioning';

interface Props {
  alertManagerSourceName: string;
  muteTimingNames?: string[];
  hideActions?: boolean;
}

export const MuteTimingsTable: FC<Props> = ({ alertManagerSourceName, muteTimingNames, hideActions }) => {
  const styles = useStyles2(getStyles);
  const dispatch = useDispatch();
  const permissions = getNotificationsPermissions(alertManagerSourceName);
  const amConfigs = useUnifiedAlertingSelector((state) => state.amConfigs);
  const [muteTimingName, setMuteTimingName] = useState<string>('');
  const { result }: AsyncRequestState<AlertManagerCortexConfig> =
    (alertManagerSourceName && amConfigs[alertManagerSourceName]) || initialAsyncRequestState;

  const items = useMemo((): Array<DynamicTableItemProps<MuteTimeInterval>> => {
    const muteTimings = result?.alertmanager_config?.mute_time_intervals ?? [];
    const muteTimingsProvenances = result?.alertmanager_config?.muteTimeProvenances ?? {};

    return muteTimings
      .filter(({ name }) => (muteTimingNames ? muteTimingNames.includes(name) : true))
      .map((mute) => {
        return {
          id: mute.name,
          data: {
            ...mute,
            provenance: muteTimingsProvenances[mute.name],
          },
        };
      });
  }, [
    result?.alertmanager_config?.mute_time_intervals,
    result?.alertmanager_config?.muteTimeProvenances,
    muteTimingNames,
  ]);

  const columns = useColumns(alertManagerSourceName, hideActions, setMuteTimingName);

  return (
    <div className={styles.container}>
      {!hideActions && <h5>静音时间</h5>}
      {!hideActions && (
        <p>静音时间是一个命名的时间间隔，可以在通知策略树中引用该时间间隔，以便在一天中的特定时间静音特定的通知策略</p>
      )}
      {!hideActions && items.length > 0 && (
        <Authorize actions={[permissions.create]}>
          <LinkButton
            className={styles.addMuteButton}
            icon="plus"
            variant="primary"
            href={makeAMLink('alerting/routes/mute-timing/new', alertManagerSourceName)}
          >
            创建静音时间
          </LinkButton>
        </Authorize>
      )}
      {items.length > 0 ? (
        <DynamicTable items={items} cols={columns} />
      ) : !hideActions ? (
        <EmptyAreaWithCTA
          text="你还没有设置任何静音时间"
          buttonLabel="添加静音定时"
          buttonIcon="plus"
          buttonSize="lg"
          href={makeAMLink('alerting/routes/mute-timing/new', alertManagerSourceName)}
          showButton={contextSrv.hasPermission(permissions.create)}
        />
      ) : (
        <p>没有配置静音定时</p>
      )}
      {!hideActions && (
        <ConfirmModal
          isOpen={!!muteTimingName}
          title="删除静音定时"
          body={`确认删除静音定时 "${muteTimingName}"`}
          confirmText="删除"
          onConfirm={() => dispatch(deleteMuteTimingAction(alertManagerSourceName, muteTimingName))}
          onDismiss={() => setMuteTimingName('')}
        />
      )}
    </div>
  );
};

function useColumns(alertManagerSourceName: string, hideActions = false, setMuteTimingName: (name: string) => void) {
  const permissions = getNotificationsPermissions(alertManagerSourceName);

  const userHasEditPermissions = contextSrv.hasPermission(permissions.update);
  const userHasDeletePermissions = contextSrv.hasPermission(permissions.delete);
  const showActions = !hideActions && (userHasEditPermissions || userHasDeletePermissions);

  return useMemo((): Array<DynamicTableColumnProps<MuteTimeInterval>> => {
    const columns: Array<DynamicTableColumnProps<MuteTimeInterval>> = [
      {
        id: 'name',
        label: '名称',
        renderCell: function renderName({ data }) {
          return (
            <>
              {data.name} {data.provenance && <ProvisioningBadge />}
            </>
          );
        },
        size: '250px',
      },
      {
        id: 'timeRange',
        label: '时间范围',
        renderCell: ({ data }) => renderTimeIntervals(data.time_intervals),
      },
    ];
    if (showActions) {
      columns.push({
        id: 'actions',
        label: '操作',
        renderCell: function renderActions({ data }) {
          if (data.provenance) {
            return (
              <div>
                <Link
                  href={makeAMLink(`/alerting/routes/mute-timing/edit`, alertManagerSourceName, {
                    muteName: data.name,
                  })}
                >
                  <IconButton name="file-alt" title="查看静音定时" />
                </Link>
              </div>
            );
          }
          return (
            <div>
              <Authorize actions={[permissions.update]}>
                <Link
                  href={makeAMLink(`/alerting/routes/mute-timing/edit`, alertManagerSourceName, {
                    muteName: data.name,
                  })}
                >
                  <IconButton name="edit" title="编辑静音定时" />
                </Link>
              </Authorize>
              <Authorize actions={[permissions.delete]}>
                <IconButton name={'trash-alt'} title="删除静音定时" onClick={() => setMuteTimingName(data.name)} />
              </Authorize>
            </div>
          );
        },
        size: '100px',
      });
    }
    return columns;
  }, [alertManagerSourceName, setMuteTimingName, showActions, permissions]);
}

function renderTimeIntervals(timeIntervals: TimeInterval[]) {
  return timeIntervals.map((interval, index) => {
    const { times, weekdays, days_of_month, months, years } = interval;
    const timeString = getTimeString(times);
    const weekdayString = getWeekdayString(weekdays);
    const daysString = getDaysOfMonthString(days_of_month);
    const monthsString = getMonthsString(months);
    const yearsString = getYearsString(years);

    return (
      <React.Fragment key={JSON.stringify(interval) + index}>
        {`${timeString} ${weekdayString}`}
        <br />
        {[daysString, monthsString, yearsString].join(' | ')}
        <br />
      </React.Fragment>
    );
  });
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    flex-flow: column nowrap;
  `,
  addMuteButton: css`
    margin-bottom: ${theme.spacing(2)};
    align-self: flex-end;
  `,
});
