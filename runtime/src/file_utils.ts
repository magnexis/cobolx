/**
 * COBOL-X Standard Library — File I/O Utilities
 *
 * Provides COBOL-style file operations that mirror traditional COBOL
 * file handling (OPEN, READ, WRITE, CLOSE) with a modern async/await API.
 * In COBOL, files are traditionally sequential, indexed, or relative;
 * this module focuses on sequential text file operations.
 *
 * All operations use Node.js fs/promises for non-blocking I/O.
 * Error handling follows COBOL FILE STATUS conventions.
 *
 * @module file_utils
 */

import * as fs from "node:fs/promises";
import * as fsSync from "node:fs";
import * as path from "node:path";

/**
 * File status codes matching COBOL FILE STATUS conventions.
 *
 * "00" = Success
 * "10" = End of file
 * "35" = File not found (OPEN)
 * "93" = File locked / conflict
 * "99" = I/O error (unknown)
 */
export type FileStatus = "00" | "10" | "35" | "93" | "99";

/** Result type for file operations with COBOL-style status. */
export interface FileResult<T = string> {
  status: FileStatus;
  data?: T;
  error?: string;
}

/**
 * FILE-READ — Reads the entire contents of a text file.
 *
 * COBOL equivalent: OPEN INPUT file, READ file INTO ws-record, CLOSE file.
 *
 * @param filePath - The path to the file to read.
 * @param encoding - The character encoding (default: "utf8").
 * @returns A FileResult with the file contents on success.
 *
 * @example
 * const result = await FILE_READ("/data/records.txt");
 * IF result.status = "00"
 *   DISPLAY result.data
 * END-IF
 */
export async function FILE_READ(
  filePath: string,
  encoding: BufferEncoding = "utf8"
): Promise<FileResult> {
  if (typeof filePath !== "string") {
    return { status: "99", error: `FILE-READ: filePath must be PIC X, received ${typeof filePath}` };
  }
  try {
    const resolvedPath = path.resolve(filePath);
    const data = await fs.readFile(resolvedPath, encoding);
    return { status: "00", data };
  } catch (err: unknown) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code === "ENOENT") {
      return { status: "35", error: `FILE-READ: file not found '${filePath}'` };
    }
    if (nodeErr.code === "EACCES") {
      return { status: "93", error: `FILE-READ: permission denied '${filePath}'` };
    }
    return { status: "99", error: `FILE-READ: ${nodeErr.message}` };
  }
}

/**
 * FILE-WRITE — Writes content to a text file, creating or overwriting it.
 *
 * COBOL equivalent: OPEN OUTPUT file, WRITE ws-record FROM ws-data, CLOSE file.
 *
 * @param filePath - The path to the file to write.
 * @param content - The content to write to the file.
 * @param encoding - The character encoding (default: "utf8").
 * @returns A FileResult indicating success or failure.
 *
 * @example
 * const result = await FILE_WRITE("/data/output.txt", "Hello COBOL-X");
 */
export async function FILE_WRITE(
  filePath: string,
  content: string,
  encoding: BufferEncoding = "utf8"
): Promise<FileResult> {
  if (typeof filePath !== "string") {
    return { status: "99", error: `FILE-WRITE: filePath must be PIC X, received ${typeof filePath}` };
  }
  if (typeof content !== "string") {
    return { status: "99", error: `FILE-WRITE: content must be PIC X, received ${typeof content}` };
  }
  try {
    const resolvedPath = path.resolve(filePath);
    // Ensure parent directory exists (COBOL doesn't need this, but it's helpful)
    const dir = path.dirname(resolvedPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(resolvedPath, content, encoding);
    return { status: "00" };
  } catch (err: unknown) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code === "EACCES") {
      return { status: "93", error: `FILE-WRITE: permission denied '${filePath}'` };
    }
    return { status: "99", error: `FILE-WRITE: ${nodeErr.message}` };
  }
}

/**
 * FILE-APPEND — Appends content to an existing text file.
 *
 * COBOL equivalent: OPEN EXTEND file, WRITE ws-record, CLOSE file.
 *
 * @param filePath - The path to the file.
 * @param content - The content to append.
 * @param encoding - The character encoding (default: "utf8").
 * @returns A FileResult indicating success or failure.
 *
 * @example
 * const result = await FILE_APPEND("/data/log.txt", "New log entry\n");
 */
export async function FILE_APPEND(
  filePath: string,
  content: string,
  encoding: BufferEncoding = "utf8"
): Promise<FileResult> {
  if (typeof filePath !== "string") {
    return { status: "99", error: `FILE-APPEND: filePath must be PIC X, received ${typeof filePath}` };
  }
  if (typeof content !== "string") {
    return { status: "99", error: `FILE-APPEND: content must be PIC X, received ${typeof content}` };
  }
  try {
    const resolvedPath = path.resolve(filePath);
    await fs.appendFile(resolvedPath, content, encoding);
    return { status: "00" };
  } catch (err: unknown) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code === "ENOENT") {
      return { status: "35", error: `FILE-APPEND: file not found '${filePath}'` };
    }
    if (nodeErr.code === "EACCES") {
      return { status: "93", error: `FILE-APPEND: permission denied '${filePath}'` };
    }
    return { status: "99", error: `FILE-APPEND: ${nodeErr.message}` };
  }
}

/**
 * FILE-EXISTS — Checks whether a file or directory exists at the given path.
 *
 * COBOL equivalent: OPEN INPUT file with FILE STATUS check for "35".
 *
 * @param filePath - The path to check.
 * @returns 1 if the file/directory exists, 0 otherwise.
 *
 * @example
 * IF FILE_EXISTS("/data/records.txt") = 1
 *   DISPLAY "File exists"
 * END-IF
 */
export function FILE_EXISTS(filePath: string): 0 | 1 {
  if (typeof filePath !== "string") {
    throw new Error(`FILE-EXISTS: filePath must be PIC X, received ${typeof filePath}`);
  }
  try {
    const resolvedPath = path.resolve(filePath);
    fsSync.accessSync(resolvedPath, fsSync.constants.F_OK);
    return 1;
  } catch {
    return 0;
  }
}

/**
 * FILE-DELETE — Deletes a file at the given path.
 *
 * COBOL equivalent: OPEN I-O file, DELETE file, CLOSE file.
 *
 * @param filePath - The path to the file to delete.
 * @returns A FileResult indicating success or failure.
 *
 * @example
 * const result = await FILE_DELETE("/data/temp.txt");
 */
export async function FILE_DELETE(filePath: string): Promise<FileResult> {
  if (typeof filePath !== "string") {
    return { status: "99", error: `FILE-DELETE: filePath must be PIC X, received ${typeof filePath}` };
  }
  try {
    const resolvedPath = path.resolve(filePath);
    await fs.unlink(resolvedPath);
    return { status: "00" };
  } catch (err: unknown) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code === "ENOENT") {
      return { status: "35", error: `FILE-DELETE: file not found '${filePath}'` };
    }
    if (nodeErr.code === "EACCES" || nodeErr.code === "EPERM") {
      return { status: "93", error: `FILE-DELETE: permission denied '${filePath}'` };
    }
    return { status: "99", error: `FILE-DELETE: ${nodeErr.message}` };
  }
}

/**
 * LIST-DIRECTORY — Lists the files and subdirectories in a directory.
 *
 * COBOL equivalent: No direct equivalent; traditionally done via OS CALL.
 *
 * @param dirPath - The path to the directory to list.
 * @param options - Options: recursive (default: false), pattern (glob, default: all).
 * @returns A FileResult with an array of entry names on success.
 *
 * @example
 * const result = await LIST_DIRECTORY("/data");
 * IF result.status = "00"
 *   DISPLAY result.data  // ["file1.txt", "file2.txt", "subdir/"]
 * END-IF
 */
export async function LIST_DIRECTORY(
  dirPath: string,
  options: { recursive?: boolean; pattern?: string } = {}
): Promise<FileResult<string[]>> {
  if (typeof dirPath !== "string") {
    return { status: "99", error: `LIST-DIRECTORY: dirPath must be PIC X, received ${typeof dirPath}` };
  }
  const { recursive = false, pattern } = options;

  try {
    const resolvedPath = path.resolve(dirPath);
    const stat = await fs.stat(resolvedPath);
    if (!stat.isDirectory()) {
      return { status: "99", error: `LIST-DIRECTORY: '${dirPath}' is not a directory` };
    }

    let entries: string[];
    if (recursive) {
      entries = await listRecursive(resolvedPath, resolvedPath);
    } else {
      const rawEntries = await fs.readdir(resolvedPath, { withFileTypes: true });
      entries = rawEntries.map((entry) =>
        entry.isDirectory() ? `${entry.name}/` : entry.name
      );
    }

    // Apply pattern filter if provided
    if (pattern) {
      const regex = new RegExp(pattern, "i");
      entries = entries.filter((e) => regex.test(e));
    }

    return { status: "00", data: entries };
  } catch (err: unknown) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code === "ENOENT") {
      return { status: "35", error: `LIST-DIRECTORY: directory not found '${dirPath}'` };
    }
    if (nodeErr.code === "EACCES") {
      return { status: "93", error: `LIST-DIRECTORY: permission denied '${dirPath}'` };
    }
    return { status: "99", error: `LIST-DIRECTORY: ${nodeErr.message}` };
  }
}

/**
 * Internal helper: recursively list all files under a directory.
 */
async function listRecursive(basePath: string, currentPath: string): Promise<string[]> {
  const results: string[] = [];
  const entries = await fs.readdir(currentPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentPath, entry.name);
    const relativePath = path.relative(basePath, fullPath);
    if (entry.isDirectory()) {
      results.push(`${relativePath}/`);
      const subEntries = await listRecursive(basePath, fullPath);
      results.push(...subEntries);
    } else {
      results.push(relativePath);
    }
  }

  return results;
}

/**
 * FILE-COPY — Copies a file from source to destination.
 *
 * COBOL equivalent: READ source, WRITE destination (manual loop).
 *
 * @param sourcePath - The source file path.
 * @param destPath - The destination file path.
 * @returns A FileResult indicating success or failure.
 *
 * @example
 * const result = await FILE_COPY("/data/input.txt", "/data/backup/input.txt");
 */
export async function FILE_COPY(sourcePath: string, destPath: string): Promise<FileResult> {
  if (typeof sourcePath !== "string") {
    return { status: "99", error: `FILE-COPY: sourcePath must be PIC X, received ${typeof sourcePath}` };
  }
  if (typeof destPath !== "string") {
    return { status: "99", error: `FILE-COPY: destPath must be PIC X, received ${typeof destPath}` };
  }
  try {
    const resolvedSource = path.resolve(sourcePath);
    const resolvedDest = path.resolve(destPath);

    // Ensure destination directory exists
    const destDir = path.dirname(resolvedDest);
    await fs.mkdir(destDir, { recursive: true });

    await fs.copyFile(resolvedSource, resolvedDest);
    return { status: "00" };
  } catch (err: unknown) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code === "ENOENT") {
      return { status: "35", error: `FILE-COPY: file not found '${sourcePath}'` };
    }
    if (nodeErr.code === "EACCES") {
      return { status: "93", error: `FILE-COPY: permission denied` };
    }
    return { status: "99", error: `FILE-COPY: ${nodeErr.message}` };
  }
}

/**
 * FILE-MOVE — Moves (renames) a file from source to destination.
 *
 * COBOL equivalent: No direct equivalent; uses OS-level rename.
 *
 * @param sourcePath - The source file path.
 * @param destPath - The destination file path.
 * @returns A FileResult indicating success or failure.
 *
 * @example
 * const result = await FILE_MOVE("/data/temp.txt", "/data/archive/old.txt");
 */
export async function FILE_MOVE(sourcePath: string, destPath: string): Promise<FileResult> {
  if (typeof sourcePath !== "string") {
    return { status: "99", error: `FILE-MOVE: sourcePath must be PIC X, received ${typeof sourcePath}` };
  }
  if (typeof destPath !== "string") {
    return { status: "99", error: `FILE-MOVE: destPath must be PIC X, received ${typeof destPath}` };
  }
  try {
    const resolvedSource = path.resolve(sourcePath);
    const resolvedDest = path.resolve(destPath);

    // Ensure destination directory exists
    const destDir = path.dirname(resolvedDest);
    await fs.mkdir(destDir, { recursive: true });

    await fs.rename(resolvedSource, resolvedDest);
    return { status: "00" };
  } catch (err: unknown) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code === "ENOENT") {
      return { status: "35", error: `FILE-MOVE: file not found '${sourcePath}'` };
    }
    if (nodeErr.code === "EACCES") {
      return { status: "93", error: `FILE-MOVE: permission denied` };
    }
    if (nodeErr.code === "EXDEV") {
      // Cross-device move: copy + delete
      const copyResult = await FILE_COPY(sourcePath, destPath);
      if (copyResult.status !== "00") {
        return copyResult;
      }
      return FILE_DELETE(sourcePath);
    }
    return { status: "99", error: `FILE-MOVE: ${nodeErr.message}` };
  }
}

/**
 * FILE-SIZE — Returns the size of a file in bytes.
 *
 * COBOL equivalent: No direct equivalent; uses OS CALL.
 *
 * @param filePath - The path to the file.
 * @returns A FileResult with the file size in bytes, or error status.
 *
 * @example
 * const result = await FILE_SIZE("/data/records.txt");
 * DISPLAY result.data  // e.g., 1024
 */
export async function FILE_SIZE(filePath: string): Promise<FileResult<number>> {
  if (typeof filePath !== "string") {
    return { status: "99", error: `FILE-SIZE: filePath must be PIC X, received ${typeof filePath}` };
  }
  try {
    const resolvedPath = path.resolve(filePath);
    const stat = await fs.stat(resolvedPath);
    return { status: "00", data: stat.size };
  } catch (err: unknown) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code === "ENOENT") {
      return { status: "35", error: `FILE-SIZE: file not found '${filePath}'` };
    }
    if (nodeErr.code === "EACCES") {
      return { status: "93", error: `FILE-SIZE: permission denied '${filePath}'` };
    }
    return { status: "99", error: `FILE-SIZE: ${nodeErr.message}` };
  }
}