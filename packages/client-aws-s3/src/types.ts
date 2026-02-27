import { GetObjectCommandInput, PutObjectCommandInput, PutObjectCommandOutput } from "@aws-sdk/client-s3";

export interface ClientAwsS3Params {
  bucketName: string;
}

export interface ClientAwsS3 {
  getFile: (params: GetFileParams) => Promise<string>;
  getSignedUrl: (params: GetSignedUrlParams) => Promise<string>;
  uploadFile: (params: UploadFileParams) => Promise<string>;
}

export interface GetFileParams {
  key: string;
  options?: Omit<GetObjectCommandInput, "Bucket" | "Key">;
}

export interface GetSignedUrlParams {
  key: string;
  fileType: PutObjectCommandInput["ContentType"];
  options?: Omit<PutObjectCommandInput, "Bucket" | "Key" | "ContentType">;
}

export interface UploadFileParams {
  key: string;
  file: Buffer;
  fileType: PutObjectCommandInput["ContentType"];
  options?: Omit<PutObjectCommandInput, "Bucket" | "Key" | "ContentType" | "Body">;
}