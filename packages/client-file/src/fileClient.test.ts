import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FileClient } from "./fileClient";
import { NotFoundError } from "@vassembly/errors";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";

vi.mock("@vassembly/logger");

describe("FileClient", () => {
  let testDir: string;
  let client: ReturnType<typeof FileClient>;

  beforeEach(async () => {
    testDir = join(tmpdir(), `test-file-client-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    client = FileClient({ basePath: testDir });
  });

  afterEach(async () => {
    if (testDir) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  describe("initialization", () => {
    it("should create a file client with basePath", () => {
      const fileClient = FileClient({ basePath: testDir });
      expect(fileClient).toBeDefined();
      expect(fileClient.read).toBeDefined();
      expect(fileClient.write).toBeDefined();
      expect(fileClient.remove).toBeDefined();
      expect(fileClient.removeIfExists).toBeDefined();
    });

    it("should create a file client with default basePath", () => {
      const fileClient = FileClient({});
      expect(fileClient).toBeDefined();
    });
  });

  describe("read", () => {
    it("should read file content successfully", async () => {
      const fileName = "test.txt";
      const content = "Hello, World!";
      await fs.writeFile(join(testDir, fileName), content);

      const result = await client.read({ filePath: fileName });
      expect(result).toBe(content);
    });

    it("should read file with multiple lines", async () => {
      const fileName = "multiline.txt";
      const content = "Line 1\nLine 2\nLine 3";
      await fs.writeFile(join(testDir, fileName), content);

      const result = await client.read({ filePath: fileName });
      expect(result).toBe(content);
    });

    it("should throw NotFoundError when file does not exist", async () => {
      await expect(
        client.read({ filePath: "nonexistent.txt" })
      ).rejects.toThrow(NotFoundError);
    });

    it("should read nested file paths", async () => {
      const nestedPath = "subdir/nested.txt";
      const content = "Nested content";
      await fs.mkdir(join(testDir, "subdir"), { recursive: true });
      await fs.writeFile(join(testDir, nestedPath), content);

      const result = await client.read({ filePath: nestedPath });
      expect(result).toBe(content);
    });

    it("should read file with UTF-8 content", async () => {
      const fileName = "utf8.txt";
      const content = "Hello 世界 🌍";
      await fs.writeFile(join(testDir, fileName), content, "utf-8");

      const result = await client.read({ filePath: fileName });
      expect(result).toBe(content);
    });
  });

  describe("write", () => {
    it("should write file successfully", async () => {
      const fileName = "output.txt";
      const content = "Written content";

      await client.write({ filePath: fileName, content });

      const fileContent = await fs.readFile(join(testDir, fileName), "utf-8");
      expect(fileContent).toBe(content);
    });

    it("should overwrite existing file", async () => {
      const fileName = "existing.txt";
      await fs.writeFile(join(testDir, fileName), "Original");

      const newContent = "Updated content";
      await client.write({ filePath: fileName, content: newContent });

      const fileContent = await fs.readFile(join(testDir, fileName), "utf-8");
      expect(fileContent).toBe(newContent);
    });

    it("should write to nested file paths", async () => {
      const nestedPath = "subdir/output.txt";
      const content = "Nested output";

      await fs.mkdir(join(testDir, "subdir"), { recursive: true });
      await client.write({ filePath: nestedPath, content });

      const fileContent = await fs.readFile(join(testDir, nestedPath), "utf-8");
      expect(fileContent).toBe(content);
    });

    it("should write file with UTF-8 content", async () => {
      const fileName = "utf8-output.txt";
      const content = "Escribir 世界 🚀";

      await client.write({ filePath: fileName, content });

      const fileContent = await fs.readFile(join(testDir, fileName), "utf-8");
      expect(fileContent).toBe(content);
    });

    it("should write empty file", async () => {
      const fileName = "empty.txt";

      await client.write({ filePath: fileName, content: "" });

      const fileContent = await fs.readFile(join(testDir, fileName), "utf-8");
      expect(fileContent).toBe("");
    });
  });

  describe("remove", () => {
    it("should remove file successfully", async () => {
      const fileName = "to-delete.txt";
      await fs.writeFile(join(testDir, fileName), "content");

      await client.remove({ filePath: fileName });

      await expect(
        fs.access(join(testDir, fileName))
      ).rejects.toThrow();
    });

    it("should remove nested file", async () => {
      const nestedPath = "subdir/to-delete.txt";
      await fs.mkdir(join(testDir, "subdir"), { recursive: true });
      await fs.writeFile(join(testDir, nestedPath), "content");

      await client.remove({ filePath: nestedPath });

      await expect(
        fs.access(join(testDir, nestedPath))
      ).rejects.toThrow();
    });

    it("should throw NotFoundError when file does not exist", async () => {
      await expect(
        client.remove({ filePath: "nonexistent.txt" })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("removeIfExists", () => {
    it("should remove file when it exists", async () => {
      const fileName = "to-delete-if-exists.txt";
      await fs.writeFile(join(testDir, fileName), "content");

      await client.removeIfExists({ filePath: fileName });

      await expect(fs.access(join(testDir, fileName))).rejects.toThrow();
    });

    it("should not throw when file does not exist", async () => {
      await expect(
        client.removeIfExists({ filePath: "nonexistent.txt" }),
      ).resolves.toBeUndefined();
    });
  });
});
