import { config } from "@vassembly/config";
import { InternalError } from "@vassembly/errors";
import {
  SESClient,
  CreateTemplateCommand,
  UpdateTemplateCommand,
  DeleteTemplateCommand,
  GetTemplateCommand,
  ListTemplatesCommand,
  SendTemplatedEmailCommand,
} from "@aws-sdk/client-ses";
import {
  ClientAwsSesParams,
  ClientAwsSes,
  CreateEmailTemplateParams,
  UpdateEmailTemplateParams,
  DeleteEmailTemplateParams,
  GetEmailTemplateParams,
  GetEmailTemplateResult,
  ListEmailTemplatesResult,
  SendEmailParams,
} from "./types.js";

const CONSOLE_LOG_PREFIX = "client-aws-ses ::";

export const AwsSesClient = ({ configurationSetName }: ClientAwsSesParams = {}): ClientAwsSes => {
  const sesConfig = {
    region: config.aws.region,
    credentials: {
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
    },
  };

  const sesClient = new SESClient(sesConfig);

  const createEmailTemplate = async ({
    name,
    subject,
    html,
    text,
  }: CreateEmailTemplateParams): Promise<void> => {
    try {
      const command = new CreateTemplateCommand({
        Template: {
          TemplateName: name,
          SubjectPart: subject,
          HtmlPart: html,
          TextPart: text,
        },
      });
      await sesClient.send(command);
    } catch {
      throw new InternalError(`${CONSOLE_LOG_PREFIX} aws error on create email template`);
    }
  };

  const updateEmailTemplate = async ({
    name,
    subject,
    html,
    text,
  }: UpdateEmailTemplateParams): Promise<void> => {
    try {
      const command = new UpdateTemplateCommand({
        Template: {
          TemplateName: name,
          SubjectPart: subject,
          HtmlPart: html,
          TextPart: text,
        },
      });
      await sesClient.send(command);
    } catch {
      throw new InternalError(`${CONSOLE_LOG_PREFIX} aws error on update email template`);
    }
  };

  const deleteEmailTemplate = async ({
    name,
  }: DeleteEmailTemplateParams): Promise<void> => {
    try {
      const command = new DeleteTemplateCommand({
        TemplateName: name,
      });
      await sesClient.send(command);
    } catch {
      throw new InternalError(`${CONSOLE_LOG_PREFIX} aws error on delete email template`);
    }
  };

  const getEmailTemplate = async ({
    name,
  }: GetEmailTemplateParams): Promise<GetEmailTemplateResult> => {
    try {
      const command = new GetTemplateCommand({
        TemplateName: name,
      });
      const response = await sesClient.send(command);
      return {
        name: response.Template?.TemplateName || "",
        subject: response.Template?.SubjectPart || "",
        html: response.Template?.HtmlPart || "",
        text: response.Template?.TextPart,
      };
    } catch {
      throw new InternalError(`${CONSOLE_LOG_PREFIX} aws error on get email template`);
    }
  };

  const listEmailTemplates = async (): Promise<ListEmailTemplatesResult> => {
    try {
      const command = new ListTemplatesCommand({});
      const response = await sesClient.send(command);
      return {
        templates: (response.TemplatesMetadata || []).map((template) => ({
          name: template.Name || "",
          createdTimestamp: template.CreatedTimestamp || new Date(),
        })),
      };
    } catch {
      throw new InternalError(`${CONSOLE_LOG_PREFIX} aws error on list email templates`);
    }
  };

  const sendEmail = async ({
    templateName,
    recipients,
    source,
    templateData,
  }: SendEmailParams): Promise<string> => {
    try {
      const command = new SendTemplatedEmailCommand({
        Template: templateName,
        Destination: {
          ToAddresses: recipients,
        },
        Source: source,
        TemplateData: templateData ? JSON.stringify(templateData) : "{}",
        ConfigurationSetName: configurationSetName,
      });
      const response = await sesClient.send(command);
      return response.MessageId || "";
    } catch {
      throw new InternalError(`${CONSOLE_LOG_PREFIX} aws error on send email`);
    }
  };

  return {
    createEmailTemplate,
    updateEmailTemplate,
    deleteEmailTemplate,
    getEmailTemplate,
    listEmailTemplates,
    sendEmail,
  };
};
