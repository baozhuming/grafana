import React, { useEffect, useState } from 'react';

import { Button, ConfirmModal } from '@grafana/ui';

type Props = {
  isRaw: boolean;
  onChange: (newIsRaw: boolean) => void;
};

export const QueryEditorModeSwitcher = ({ isRaw, onChange }: Props): JSX.Element => {
  const [isModalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    // if the isRaw changes, we hide the modal
    setModalOpen(false);
  }, [isRaw]);

  if (isRaw) {
    return (
      <>
        <Button
          aria-label="Switch to visual editor"
          icon="pen"
          variant="secondary"
          type="button"
          onClick={() => {
            // we show the are-you-sure modal
            setModalOpen(true);
          }}
        ></Button>
        <ConfirmModal
          isOpen={isModalOpen}
          title="切换到可视化编辑器模式"
          body="您确定要切换到可视化编辑器模式吗?您将丢失在原始查询模式下所做的更改"
          confirmText="是的，切换到编辑器模式"
          dismissText="不，保持原始查询模式"
          onConfirm={() => {
            onChange(false);
          }}
          onDismiss={() => {
            setModalOpen(false);
          }}
        />
      </>
    );
  } else {
    return (
      <Button
        aria-label="Switch to text editor"
        icon="pen"
        variant="secondary"
        type="button"
        onClick={() => {
          onChange(true);
        }}
      ></Button>
    );
  }
};
