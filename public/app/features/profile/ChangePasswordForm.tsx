import { css } from '@emotion/css';
import React, { FC } from 'react';

import { Button, Field, Form, HorizontalGroup, LinkButton } from '@grafana/ui';
import config from 'app/core/config';
import { UserDTO } from 'app/types';

import { PasswordField } from '../../core/components/PasswordField/PasswordField';

import { ChangePasswordFields } from './types';

export interface Props {
  user: UserDTO;
  isSaving: boolean;
  onChangePassword: (payload: ChangePasswordFields) => void;
}

export const ChangePasswordForm: FC<Props> = ({ user, onChangePassword, isSaving }) => {
  const { disableLoginForm } = config;
  const authSource = user.authLabels?.length && user.authLabels[0];

  if (authSource === 'LDAP' || authSource === 'Auth Proxy') {
    return <p>使用LDAP或身份验证代理登录时无法修改密码</p>;
  }
  if (authSource && disableLoginForm) {
    return <p>此处无法修改密码</p>;
  }

  return (
    <div
      className={css`
        max-width: 400px;
      `}
    >
      <Form onSubmit={onChangePassword}>
        {({ register, errors, getValues }) => {
          return (
            <>
              <Field label="旧密码" invalid={!!errors.oldPassword} error={errors?.oldPassword?.message}>
                <PasswordField
                  id="current-password"
                  autoComplete="current-password"
                  {...register('oldPassword', { required: '请输入旧密码' })}
                />
              </Field>

              <Field label="新密码" invalid={!!errors.newPassword} error={errors?.newPassword?.message}>
                <PasswordField
                  id="new-password"
                  autoComplete="new-password"
                  {...register('newPassword', {
                    required: '请输入新密码',
                    validate: {
                      confirm: (v) => v === getValues().confirmNew || '与确认密码必须相同',
                      old: (v) => v !== getValues().oldPassword || `新密码不能与旧密码相同`,
                    },
                  })}
                />
              </Field>

              <Field label="确认密码" invalid={!!errors.confirmNew} error={errors?.confirmNew?.message}>
                <PasswordField
                  id="confirm-new-password"
                  autoComplete="new-password"
                  {...register('confirmNew', {
                    required: '请输入确认密码',
                    validate: (v) => v === getValues().newPassword || '与新密码必须相同',
                  })}
                />
              </Field>
              <HorizontalGroup>
                <Button variant="primary" disabled={isSaving} type="submit">
                  确认
                </Button>
                <LinkButton variant="secondary" href={`${config.appSubUrl}/profile`} fill="outline">
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
