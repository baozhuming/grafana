import { css } from '@emotion/css';
import React, { FC, ReactElement } from 'react';

import { selectors } from '@grafana/e2e-selectors';
import { Button, Form, Input, Field } from '@grafana/ui';

import { PasswordField } from '../PasswordField/PasswordField';

import { FormModel } from './LoginCtrl';

interface Props {
  children: ReactElement;
  onSubmit: (data: FormModel) => void;
  isLoggingIn: boolean;
  passwordHint: string;
  loginHint: string;
}

const wrapperStyles = css`
  width: 100%;
  padding-bottom: 16px;
`;

export const submitButton = css`
  justify-content: center;
  width: 100%;
`;

export const LoginForm: FC<Props> = ({ children, onSubmit, isLoggingIn, passwordHint, loginHint }) => {
  return (
    <div className={wrapperStyles}>
      <Form onSubmit={onSubmit} validateOn="onChange">
        {({ register, errors }) => (
          <>
            <Field label="邮箱或用户名" invalid={!!errors.user} error={errors.user?.message}>
              <Input
                {...register('user', { required: '请输入邮箱或用户名' })}
                autoFocus
                autoCapitalize="none"
                placeholder={loginHint}
                aria-label={selectors.pages.Login.username}
              />
            </Field>
            <Field label="密码" invalid={!!errors.password} error={errors.password?.message}>
              <PasswordField
                id="current-password"
                autoComplete="current-password"
                passwordHint={passwordHint}
                {...register('password', { required: '请输入密码' })}
              />
            </Field>
            <Button
              type="submit"
              aria-label={selectors.pages.Login.submit}
              className={submitButton}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? '登陆中...' : '登陆'}
            </Button>
            {children}
          </>
        )}
      </Form>
    </div>
  );
};
