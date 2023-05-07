import React, { PureComponent } from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { NavModelItem } from '@grafana/data';
import { config } from '@grafana/runtime';
import { Button, Input, Form, Field } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

import { validationSrv } from '../../manage-dashboards/services/ValidationSrv';
import { createNewFolder } from '../state/actions';

const mapDispatchToProps = {
  createNewFolder,
};

const connector = connect(null, mapDispatchToProps);

interface OwnProps {}

interface FormModel {
  folderName: string;
}

const initialFormModel: FormModel = { folderName: '' };

type Props = OwnProps & ConnectedProps<typeof connector>;

export class NewDashboardsFolder extends PureComponent<Props> {
  onSubmit = (formData: FormModel) => {
    this.props.createNewFolder(formData.folderName);
  };

  validateFolderName = (folderName: string) => {
    return validationSrv
      .validateNewFolderName(folderName)
      .then(() => {
        return true;
      })
      .catch((e) => {
        return e.message;
      });
  };

  pageNav: NavModelItem = {
    text: '创建一个新文件夹',
    subTitle: '文件夹提供了对指示板和警报规则进行分组的方法',
    breadcrumbs: [{ title: '仪表盘', url: 'dashboards' }],
  };

  render() {
    return (
      <Page navId="dashboards/browse" pageNav={this.pageNav}>
        <Page.Contents>
          {!config.featureToggles.topnav && <h3>新建仪表盘文件夹</h3>}
          <Form defaultValues={initialFormModel} onSubmit={this.onSubmit}>
            {({ register, errors }) => (
              <>
                <Field
                  label="文件夹名称"
                  invalid={!!errors.folderName}
                  error={errors.folderName && errors.folderName.message}
                >
                  <Input
                    id="folder-name-input"
                    {...register('folderName', {
                      required: '请输入文件夹名称',
                      validate: async (v) => await this.validateFolderName(v),
                    })}
                  />
                </Field>
                <Button type="submit">创建</Button>
              </>
            )}
          </Form>
        </Page.Contents>
      </Page>
    );
  }
}

export default connector(NewDashboardsFolder);
