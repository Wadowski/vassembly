import { config } from "@vassembly/config";
import { InternalError } from "@vassembly/errors";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as getSignedUrlAwsSdk } from "@aws-sdk/s3-request-presigner";
import { ClientAwsS3Params, GetFileParams, GetSignedUrlParams, UploadFileParams } from "./types";

const CONSOLE_LOG_PREFIX = "client-aws-s3 ::";
const EXPIRES_IN = 60 * 60; // 1 hour

export const AwsS3Client = ({ bucketName }: ClientAwsS3Params) => {
  const s3Config = {
    region: config.aws.region,
    credentials: {
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
    },
  };

  const s3Client = new S3Client(s3Config);

  const getFile = async ({ key, options = {} }: GetFileParams) => {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
        ...options,
      });
      const response = await s3Client.send(command);
      return response.Body?.transformToString();  
    } catch (err) {
      throw new InternalError(`${CONSOLE_LOG_PREFIX} aws error on get object`);
    }
  };

  const getSignedUrl = async ({ key, fileType, options = {} }: GetSignedUrlParams) => {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: fileType,
        ...options,
      });
      const signedUrl = await getSignedUrlAwsSdk(s3Client, command, { expiresIn: EXPIRES_IN });
      return signedUrl;
    } catch (err) {
      throw new InternalError(`${CONSOLE_LOG_PREFIX} aws error on get signed url`);
    }
  };

  const uploadFile = async ({ key, file, fileType, options = {} }: UploadFileParams) => {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: file,
        ContentType: fileType,
        ...options,
      });
      await s3Client.send(command);
      return key;
      } catch (err) {
        throw new InternalError(`${CONSOLE_LOG_PREFIX} aws error on upload file`);
      }
    };

    return {
      getFile,
      getSignedUrl,
      uploadFile,
    };
  };
