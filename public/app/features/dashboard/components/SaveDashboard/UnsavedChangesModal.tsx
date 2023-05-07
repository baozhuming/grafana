import { css } from '@emotion/css';
import React from 'react';

import { Button, Modal } from '@grafana/ui';

import { DashboardModel } from '../../state';

import { SaveDashboardButton } from './SaveDashboardButton';

interface UnsavedChangesModalProps {
  dashboard: DashboardModel;
  onDiscard: () => void;
  onDismiss: () => void;
  onSaveSuccess?: () => void;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  dashboard,
  onSaveSuccess,
  onDiscard,
  onDismiss,
}) => {
  return (
    <Modal
      isOpen={true}
      title="未保存的更改"
      onDismiss={onDismiss}
      icon="exclamation-triangle"
      className={css`
        width: 500px;
      `}
    >
      <h5>要保存更改吗?</h5>
      <Modal.ButtonRow>
        <Button variant="secondary" onClick={onDismiss} fill="outline">
          取消
        </Button>
        <Button variant="destructive" onClick={onDiscard}>
          放弃更改
        </Button>
        <SaveDashboardButton dashboard={dashboard} onSaveSuccess={onSaveSuccess} />
      </Modal.ButtonRow>
    </Modal>
  );
};
