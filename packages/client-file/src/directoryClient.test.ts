import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DirectoryClient } from "./directoryClient";
import { InternalError } from "@vassembly/errors";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";

vi.mock("@vassembly/logger");

describe("DirectoryClient", () => {
  let testDir: string;
  let client: ReturnType<typeof DirectoryClient>;

  beforeEach(async () => {
    testDir = join(tmpdir(), `test-dir-client-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    client = DirectoryClient({ basePath: testDir });
  });

  afterEach(async () => {
    if (testDir) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  describe("initialization", () => {
    it("should create a directory client with basePath", () => {
      const dirClient = DirectoryClient({ basePath: testDir });
      expect(dirClient).toBeDefined();
      expect(dirClient.list).toBeDefined();
      expect(dirClient.create).toBeDefined();
      expect(dirClient.remove).toBeDefined();
    });

    it("should create a directory client with default basePath", () => {
      const dirClient = DirectoryClient({});
      expect(dirClient).toBeDefined();
    });
  });

  describe("list", () => {
    it("should list empty directory", async () => {
      const subDir = "empty";
      await fs.mkdir(join(testDir, subDir));

      const result = await client.list({ dirPath: subDir });
      expect(result).toEqual([]);
    });

    it("should list directory with files", async () => {
      const subDir = "with-files";
      await fs.mkdir(join(testDir, subDir));
      await fs.writeFile(join(testDir, subDir, "file1.txt"), "content1");
      await fs.writeFile(join(testDir, subDir, "file2.txt"), "content2");

      const result = await client.list({ dirPath: subDir });
      expect(result).toHaveLength(2);
      expect(result).toEqual(
        expect.arrayContaining([
          { name: "file1.txt", isDirectory: false },
          { name: "file2.txt", isDirectory: false },
        ])
      );
    });

    it("should list directory with subdirectories", async () => {
      const subDir = "with-dirs";
      await fs.mkdir(join(testDir, subDir));
      await fs.mkdir(join(testDir, subDir, "subdir1"));
      await fs.mkdir(join(testDir, subDir, "subdir2"));

      const result = await client.list({ dirPath: subDir });
      expect(result).toHaveLength(2);
      expect(result).toEqual(
        expect.arrayContaining([
          { name: "subdir1", isDirectory: true },
          { name: "subdir2", isDirectory: true },
        ])
      );
    });

    it("should list directory with mixed files and directories", async () => {
      const subDir = "mixed";
      await fs.mkdir(join(testDir, subDir));
      await fs.writeFile(join(testDir, subDir, "file.txt"), "content");
      await fs.mkdir(join(testDir, subDir, "subdir"));

      const result = await client.list({ dirPath: subDir });
      expect(result).toHaveLength(2);
      expect(result).toEqual(
        expect.arrayContaining([
          { name: "file.txt", isDirectory: false },
          { name: "subdir", isDirectory: true },
        ])
      );
    });

    it("should throw InternalError when directory does not exist", async () => {
      await expect(
        client.list({ dirPath: "nonexistent" })
      ).rejects.toThrow(InternalError);
    });

    it("should list nested directory", async () => {
      const nestedPath = "level1/level2";
      await fs.mkdir(join(testDir, nestedPath), { recursive: true });
      await fs.writeFile(join(testDir, nestedPath, "file.txt"), "content");

      const result = await client.list({ dirPath: nestedPath });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ name: "file.txt", isDirectory: false });
    });
  });

  describe("create", () => {
    it("should create single directory", async () => {
      const dirName = "new-dir";

      await client.create({ dirPath: dirName });

      const stat = await fs.stat(join(testDir, dirName));
      expect(stat.isDirectory()).toBe(true);
    });

    it("should create nested directories", async () => {
      const nestedPath = "level1/level2/level3";

      await client.create({ dirPath: nestedPath });

      const stat = await fs.stat(join(testDir, nestedPath));
      expect(stat.isDirectory()).toBe(true);
    });

    it("should handle already existing directory", async () => {
      const dirName = "existing-dir";
      await fs.mkdir(join(testDir, dirName));

      await expect(
        client.create({ dirPath: dirName })
      ).resolves.not.toThrow();
    });

    it("should create directory with special characters in name", async () => {
      const dirName = "dir-with_special.name";

      await client.create({ dirPath: dirName });

      const stat = await fs.stat(join(testDir, dirName));
      expect(stat.isDirectory()).toBe(true);
    });
  });

  describe("remove", () => {
    it("should remove empty directory", async () => {
      const dirName = "to-remove";
      await fs.mkdir(join(testDir, dirName));

      await client.remove({ dirPath: dirName });

      await expect(
        fs.access(join(testDir, dirName))
      ).rejects.toThrow();
    });

    it("should remove directory with files", async () => {
      const dirName = "to-remove-with-files";
      await fs.mkdir(join(testDir, dirName));
      await fs.writeFile(join(testDir, dirName, "file.txt"), "content");

      await client.remove({ dirPath: dirName });

      await expect(
        fs.access(join(testDir, dirName))
      ).rejects.toThrow();
    });

    it("should remove directory with nested structure", async () => {
      const dirName = "to-remove-nested";
      const nestedPath = join(testDir, dirName, "level1", "level2");
      await fs.mkdir(nestedPath, { recursive: true });
      await fs.writeFile(join(nestedPath, "file.txt"), "content");

      await client.remove({ dirPath: dirName });

      await expect(
        fs.access(join(testDir, dirName))
      ).rejects.toThrow();
    });

    it("should remove nested directory", async () => {
      const dirPath = "parent/to-remove";
      await fs.mkdir(join(testDir, dirPath), { recursive: true });

      await client.remove({ dirPath });

      await expect(
        fs.access(join(testDir, dirPath))
      ).rejects.toThrow();
    });

    it("should handle non-existent directory gracefully", async () => {
      await expect(
        client.remove({ dirPath: "nonexistent" })
      ).resolves.not.toThrow();
    });
  });
});
