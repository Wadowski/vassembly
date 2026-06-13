import { describe, it, expect, vi, beforeEach } from "vitest";
import { Readable } from "node:stream";
import { AwsS3Client } from "./client";
import { InternalError } from "@vassembly/errors";
import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl as getSignedUrlSdk } from "@aws-sdk/s3-request-presigner";
import { Upload } from "@aws-sdk/lib-storage";
import { ServerSideEncryption } from "@aws-sdk/client-s3";

vi.mock("@vassembly/config", () => ({
  config: {
    aws: {
      region: "us-east-1",
      accessKeyId: "test-access-key",
      secretAccessKey: "test-secret-key",
    },
  },
}));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(() => ({
    send: vi.fn(),
  })),
  GetObjectCommand: vi.fn((input) => ({ input, name: "GetObjectCommand" })),
  PutObjectCommand: vi.fn((input) => ({ input, name: "PutObjectCommand" })),
  DeleteObjectCommand: vi.fn(
    (input) => ({ input, name: "DeleteObjectCommand" })
  ),
  ServerSideEncryption: {
    AES256: "AES256",
  },
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(),
}));

vi.mock("@aws-sdk/lib-storage", () => ({
  Upload: vi.fn(() => ({
    done: vi.fn(),
  })),
}));

describe("AwsS3Client", () => {
  const bucketName = "test-bucket";
  let client: ReturnType<typeof AwsS3Client>;

  beforeEach(() => {
    vi.clearAllMocks();
    client = AwsS3Client({ bucketName });
  });

  describe("initialization", () => {
    it("should create a client with the provided bucket name", () => {
      const s3Client = AwsS3Client({ bucketName: "my-bucket" });
      expect(s3Client).toBeDefined();
      expect(s3Client.getFile).toBeDefined();
      expect(s3Client.getSignedUrl).toBeDefined();
      expect(s3Client.uploadFile).toBeDefined();
      expect(s3Client.uploadFileStream).toBeDefined();
      expect(s3Client.removeFile).toBeDefined();
    });
  });

  describe("getFile", () => {
    it("should return file content as string for valid key", async () => {
      const fileContent = "test file content";
      const key = "test-file.txt";

      const mockSend = vi.mocked(S3Client).mock.results[0]?.value?.send;
      if (mockSend) {
        mockSend.mockResolvedValueOnce({
          Body: {
            transformToString: vi.fn().mockResolvedValueOnce(fileContent),
          },
        });
      }

      const result = await client.getFile({ key });
      expect(typeof result).toBe("string");
    });

    it("should accept optional parameters", async () => {
      const key = "test-file.txt";
      const fileContent = "test content with options";
      const options = { ResponseCacheControl: "max-age=3600" };

      const mockSend = vi.mocked(S3Client).mock.results[0]?.value?.send;
      if (mockSend) {
        mockSend.mockResolvedValueOnce({
          Body: {
            transformToString: vi.fn().mockResolvedValueOnce(fileContent),
          },
        });
      }

      const result = await client.getFile({ key, options });
      expect(result).toBeDefined();
    });

    it("should throw InternalError on failure", async () => {
      const key = "non-existent-file.txt";

      const mockSend = vi.mocked(S3Client).mock.results[0]?.value?.send;
      if (mockSend) {
        mockSend.mockRejectedValueOnce(new Error("AWS Error"));
      }

      await expect(client.getFile({ key })).rejects.toThrow(InternalError);
    });
  });

  describe("getSignedUrl", () => {
    it("should return a signed URL string for valid key and file type", async () => {
      const key = "test-file.txt";
      const fileType = "text/plain";
      const signedUrl = "https://s3.amazonaws.com/signed-url";

      vi.mocked(getSignedUrlSdk).mockResolvedValueOnce(signedUrl);

      const result = await client.getSignedUrl({ key, fileType });
      expect(typeof result).toBe("string");
    });

    it("should accept optional parameters", async () => {
      const key = "test-file.txt";
      const fileType = "text/plain";
      const signedUrl = "https://s3.amazonaws.com/signed-url-with-options";
      const options = { ServerSideEncryption: ServerSideEncryption.AES256 };

      vi.mocked(getSignedUrlSdk).mockResolvedValueOnce(signedUrl);

      const result = await client.getSignedUrl({ key, fileType, options });
      expect(result).toBeDefined();
    });

    it("should throw InternalError on failure", async () => {
      const key = "test-file.txt";
      const fileType = "text/plain";

      vi.mocked(getSignedUrlSdk).mockRejectedValueOnce(new Error("AWS Error"));

      await expect(
        client.getSignedUrl({ key, fileType })
      ).rejects.toThrow(InternalError);
    });
  });

  describe("uploadFile", () => {
    it("should return the key on successful upload", async () => {
      const key = "test-upload.txt";
      const file = Buffer.from("test content");
      const fileType = "text/plain";

      const mockSend = vi.mocked(S3Client).mock.results[0]?.value?.send;
      if (mockSend) {
        mockSend.mockResolvedValueOnce({});
      }

      const result = await client.uploadFile({ key, file, fileType });
      expect(typeof result).toBe("string");
    });

    it("should accept optional parameters", async () => {
      const key = "test-upload.txt";
      const file = Buffer.from("test content");
      const fileType = "text/plain";
      const options = { ServerSideEncryption: ServerSideEncryption.AES256 };

      const mockSend = vi.mocked(S3Client).mock.results[0]?.value?.send;
      if (mockSend) {
        mockSend.mockResolvedValueOnce({});
      }

      const result = await client.uploadFile({
        key,
        file,
        fileType,
        options,
      });
      expect(result).toBeDefined();
    });

    it("should accept Buffer file parameter", async () => {
      const key = "test-upload.bin";
      const file = Buffer.from([0x1, 0x2, 0x3]);
      const fileType = "application/octet-stream";

      const mockSend = vi.mocked(S3Client).mock.results[0]?.value?.send;
      if (mockSend) {
        mockSend.mockResolvedValueOnce({});
      }

      const result = await client.uploadFile({ key, file, fileType });
      expect(typeof result).toBe("string");
    });

    it("should throw InternalError on failure", async () => {
      const key = "test-upload.txt";
      const file = Buffer.from("test content");
      const fileType = "text/plain";

      const mockSend = vi.mocked(S3Client).mock.results[0]?.value?.send;
      if (mockSend) {
        mockSend.mockRejectedValueOnce(new Error("AWS Error"));
      }

      await expect(
        client.uploadFile({ key, file, fileType })
      ).rejects.toThrow(InternalError);
    });
  });

  describe("uploadFileStream", () => {
    it("should return the key on successful stream upload", async () => {
      const key = "test-stream-upload.txt";
      const stream = Readable.from(["test", "content"]);
      const fileType = "text/plain";

      const mockUpload = vi.mocked(Upload).mock.results[0]?.value;
      if (mockUpload?.done) {
        mockUpload.done.mockResolvedValueOnce({});
      }

      const result = await client.uploadFileStream({
        key,
        stream,
        fileType,
      });
      expect(typeof result).toBe("string");
    });

    it("should accept optional parameters", async () => {
      const key = "test-stream-upload.txt";
      const stream = Readable.from(["test", "content"]);
      const fileType = "text/plain";
      const options = { ServerSideEncryption: ServerSideEncryption.AES256 };

      const mockUpload = vi.mocked(Upload).mock.results[0]?.value;
      if (mockUpload?.done) {
        mockUpload.done.mockResolvedValueOnce({});
      }

      const result = await client.uploadFileStream({
        key,
        stream,
        fileType,
        options,
      });
      expect(result).toBeDefined();
    });

    it("should throw InternalError on failure", async () => {
      const key = "test-stream-upload.txt";
      const stream = Readable.from(["test", "content"]);
      const fileType = "text/plain";

      vi.mocked(Upload).mockImplementationOnce(
        () => ({
          done: vi.fn().mockRejectedValueOnce(new Error("AWS Error")),
        }) as ReturnType<typeof Upload>
      );

      await expect(
        client.uploadFileStream({ key, stream, fileType })
      ).rejects.toThrow(InternalError);
    });
  });

  describe("removeFile", () => {
    it("should complete successfully for valid key", async () => {
      const key = "test-delete.txt";

      const mockSend = vi.mocked(S3Client).mock.results[0]?.value?.send;
      if (mockSend) {
        mockSend.mockResolvedValueOnce({});
      }

      const result = await client.removeFile({ key });
      expect(result).toBeUndefined();
    });

    it("should accept optional parameters", async () => {
      const key = "test-delete.txt";
      const options = { VersionId: "test-version" };

      const mockSend = vi.mocked(S3Client).mock.results[0]?.value?.send;
      if (mockSend) {
        mockSend.mockResolvedValueOnce({});
      }

      const result = await client.removeFile({ key, options });
      expect(result).toBeUndefined();
    });

    it("should throw InternalError on failure", async () => {
      const key = "non-existent-file.txt";

      const mockSend = vi.mocked(S3Client).mock.results[0]?.value?.send;
      if (mockSend) {
        mockSend.mockRejectedValueOnce(new Error("AWS Error"));
      }

      await expect(client.removeFile({ key })).rejects.toThrow(InternalError);
    });
  });
});
