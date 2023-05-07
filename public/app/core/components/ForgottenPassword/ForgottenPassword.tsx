import { css } from '@emotion/css';
import React, { useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { Form, Field, Input, Button, Legend, Container, useStyles2, HorizontalGroup, LinkButton } from '@grafana/ui';
import config from 'app/core/config';

interface EmailDTO {
  userOrEmail: string;
}

const paragraphStyles = (theme: GrafanaTheme2) => css`
  color: ${theme.colors.text.secondary};
  font-size: ${theme.typography.bodySmall.fontSize};
  font-weight: ${theme.typography.fontWeightRegular};
  margin-top: ${theme.spacing(1)};
  display: block;
`;

export const ForgottenPassword = () => {
  const [emailSent, setEmailSent] = useState(false);
  const styles = useStyles2(paragraphStyles);
  const loginHref = `${config.appSubUrl}/login`;

  const sendEmail = async (formModel: EmailDTO) => {
    const res = await getBackendSrv().post('/api/user/password/send-reset-email', formModel);
    if (res) {
      setEmailSent(true);
    }
  };

  if (emailSent) {
    return (
      <div>
        <p>已发送带有重置链接的邮件到该邮箱，你应该很快就会收到</p>
        <Container margin="md" />
        <LinkButton variant="primary" href={loginHref}>
          返回登陆
        </LinkButton>
      </div>
    );
  }
  return (
    <Form onSubmit={sendEmail}>
      {({ register, errors }) => (
        <>
          <Legend>重置密码</Legend>
          <Field
            label="用户"
            description="输入您的信息以获得发送给您的重置链接"
            invalid={!!errors.userOrEmail}
            error={errors?.userOrEmail?.message}
          >
            <Input
              id="user-input"
              placeholder="邮箱或用户名"
              {...register('userOrEmail', { required: '请输入邮箱或用户名' })}
            />
          </Field>
          <HorizontalGroup>
            <Button type="submit">发送重置邮件</Button>
            <LinkButton fill="text" href={loginHref}>
              返回登陆
            </LinkButton>
          </HorizontalGroup>

          <p className={styles}>你忘记你的用户名或邮箱了吗?请联系您的Grafana管理员</p>
        </>
      )}
    </Form>
  );
};
