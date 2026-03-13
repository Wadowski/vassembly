export interface ClientAwsSesParams {
  configurationSetName?: string;
}

export interface ClientAwsSes {
  createEmailTemplate: (params: CreateEmailTemplateParams) => Promise<void>;
  updateEmailTemplate: (params: UpdateEmailTemplateParams) => Promise<void>;
  deleteEmailTemplate: (params: DeleteEmailTemplateParams) => Promise<void>;
  getEmailTemplate: (params: GetEmailTemplateParams) => Promise<GetEmailTemplateResult>;
  listEmailTemplates: () => Promise<ListEmailTemplatesResult>;
  sendEmail: (params: SendEmailParams) => Promise<string>;
}

export interface CreateEmailTemplateParams {
  name: string;
  subject: string;
  html: string;
  text?: string;
}

export interface UpdateEmailTemplateParams {
  name: string;
  subject: string;
  html: string;
  text?: string;
}

export interface DeleteEmailTemplateParams {
  name: string;
}

export interface GetEmailTemplateParams {
  name: string;
}

export interface GetEmailTemplateResult {
  name: string;
  subject: string;
  html: string;
  text?: string;
}

export interface ListEmailTemplatesResult {
  templates: Array<{
    name: string;
    createdTimestamp: Date;
  }>;
}

export interface SendEmailParams {
  templateName: string;
  recipients: string[];
  source: string;
  templateData?: Record<string, string>;
}
