import { GetObjectCommandInput, PutObjectCommandInput, DeleteObjectCommandInput } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";

export interface ClientAwsS3Params {
  bucketName: string;
}

export interface ClientAwsS3 {
  getFile: (params: GetFileParams) => Promise<string>;
  getSignedUrl: (params: GetSignedUrlParams) => Promise<string>;
  uploadFile: (params: UploadFileParams) => Promise<string>;
  uploadFileStream: (params: UploadFileStreamParams) => Promise<string>;
  removeFile: (params: RemoveFileParams) => Promise<void>;
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

export interface UploadFileStreamParams {
  key: string;
  stream: Readable;
  fileType: PutObjectCommandInput["ContentType"];
  options?: Omit<PutObjectCommandInput, "Bucket" | "Key" | "ContentType" | "Body">;
}

export interface RemoveFileParams {
  key: string;
  options?: Omit<DeleteObjectCommandInput, "Bucket" | "Key">;
}