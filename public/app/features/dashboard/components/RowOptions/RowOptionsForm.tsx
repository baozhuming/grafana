import React, { FC, useCallback, useState } from 'react';

import { Button, Field, Form, Modal, Input } from '@grafana/ui';

import { RepeatRowSelect } from '../RepeatRowSelect/RepeatRowSelect';

export type OnRowOptionsUpdate = (title: string, repeat?: string | null) => void;

export interface Props {
  title: string;
  repeat?: string | null;
  onUpdate: OnRowOptionsUpdate;
  onCancel: () => void;
}

export const RowOptionsForm: FC<Props> = ({ repeat, title, onUpdate, onCancel }) => {
  const [newRepeat, setNewRepeat] = useState<string | null | undefined>(repeat);
  const onChangeRepeat = useCallback((name?: string | null) => setNewRepeat(name), [setNewRepeat]);

  return (
    <Form
      defaultValues={{ title }}
      onSubmit={(formData: { title: string }) => {
        onUpdate(formData.title, newRepeat);
      }}
    >
      {({ register }) => (
        <>
          <Field label="标题">
            <Input {...register('title')} type="text" />
          </Field>

          <Field label="重复">
            <RepeatRowSelect repeat={newRepeat} onChange={onChangeRepeat} />
          </Field>

          <Modal.ButtonRow>
            <Button type="button" variant="secondary" onClick={onCancel} fill="outline">
              取消
            </Button>
            <Button type="submit">更新</Button>
          </Modal.ButtonRow>
        </>
      )}
    </Form>
  );
};
