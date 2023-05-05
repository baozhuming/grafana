import React, { useState } from 'react';

import { NavModelItem } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { Page } from 'app/core/components/Page/Page';

import { PlaylistForm } from './PlaylistForm';
import { createPlaylist, getDefaultPlaylist } from './api';
import { Playlist } from './types';

export const PlaylistNewPage = () => {
  const [playlist] = useState<Playlist>(getDefaultPlaylist());

  const onSubmit = async (playlist: Playlist) => {
    await createPlaylist(playlist);
    locationService.push('/playlists');
  };

  const pageNav: NavModelItem = {
    text: '添加播放列表',
    subTitle:
      '播放列表在预先选择的仪表板列表中旋转，播放列表可以是建立态势感知的好方法，或者只是向团队或访客展示你的指标',
  };

  return (
    <Page navId="dashboards/playlists" pageNav={pageNav}>
      <Page.Contents>
        <PlaylistForm onSubmit={onSubmit} playlist={playlist} />
      </Page.Contents>
    </Page>
  );
};

export default PlaylistNewPage;
