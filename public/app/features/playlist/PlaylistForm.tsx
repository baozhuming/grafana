import React, { useMemo, useState } from 'react';

import { selectors } from '@grafana/e2e-selectors';
import { config } from '@grafana/runtime';
import { Button, Field, Form, HorizontalGroup, Input, LinkButton } from '@grafana/ui';
import { DashboardPicker } from 'app/core/components/Select/DashboardPicker';
import { TagFilter } from 'app/core/components/TagFilter/TagFilter';

import { getGrafanaSearcher } from '../search/service';

import { PlaylistTable } from './PlaylistTable';
import { Playlist } from './types';
import { usePlaylistItems } from './usePlaylistItems';

interface Props {
  onSubmit: (playlist: Playlist) => void;
  playlist: Playlist;
}

export const PlaylistForm = ({ onSubmit, playlist }: Props) => {
  const [saving, setSaving] = useState(false);
  const { name, interval, items: propItems } = playlist;
  const tagOptions = useMemo(() => {
    return () => getGrafanaSearcher().tags({ kind: ['dashboard'] });
  }, []);

  const { items, addById, addByTag, deleteItem, moveItem } = usePlaylistItems(propItems);

  const doSubmit = (list: Playlist) => {
    setSaving(true);
    onSubmit({ ...list, items });
  };

  return (
    <div>
      <Form onSubmit={doSubmit} validateOn={'onBlur'}>
        {({ register, errors }) => {
          const isDisabled = items.length === 0 || Object.keys(errors).length > 0;
          return (
            <>
              <Field label="名称" invalid={!!errors.name} error={errors?.name?.message}>
                <Input
                  type="text"
                  {...register('name', { required: '请输入名称' })}
                  placeholder="名称"
                  defaultValue={name}
                  aria-label={selectors.pages.PlaylistForm.name}
                />
              </Field>
              <Field label="时间间隔" invalid={!!errors.interval} error={errors?.interval?.message}>
                <Input
                  type="text"
                  {...register('interval', { required: '请输入时间间隔' })}
                  placeholder="5m"
                  defaultValue={interval ?? '5m'}
                  aria-label={selectors.pages.PlaylistForm.interval}
                />
              </Field>

              <PlaylistTable items={items} deleteItem={deleteItem} moveItem={moveItem} />

              <div className="gf-form-group">
                <h3 className="page-headering">添加仪表盘</h3>

                <Field label="按标题添加">
                  <DashboardPicker id="dashboard-picker" onChange={addById} key={items.length} />
                </Field>

                <Field label="按标签添加">
                  <TagFilter
                    isClearable
                    tags={[]}
                    hideValues
                    tagOptions={tagOptions}
                    onChange={addByTag}
                    placeholder="选择一个标签"
                  />
                </Field>
              </div>

              <HorizontalGroup>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isDisabled}
                  icon={saving ? 'fa fa-spinner' : undefined}
                >
                  保存
                </Button>
                <LinkButton variant="secondary" href={`${config.appSubUrl}/playlists`}>
                  取消
                </LinkButton>
              </HorizontalGroup>
            </>
          );
        }}
      </Form>
    </div>
  );
};
