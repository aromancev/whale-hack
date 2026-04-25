import { del, get, list, put } from "@vercel/blob";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Readable } from "node:stream";

export type FileStorageDriver = "local" | "vercel";

export type FileStorageBody =
  | string
  | Buffer
  | Uint8Array
  | ArrayBuffer
  | Blob
  | ReadableStream<Uint8Array>;

type VercelBlobBody = string | Readable | Buffer | Blob | ArrayBuffer | ReadableStream | File;

export type StoredFile = {
  pathname: string;
  url: string;
  downloadUrl: string;
  contentType?: string;
  size?: number;
  uploadedAt?: Date;
};

export type StoredFileContent = StoredFile & {
  body: Uint8Array;
};

export type PutFileOptions = {
  contentType?: string;
  access?: "public" | "private";
  allowOverwrite?: boolean;
  cacheControlMaxAge?: number;
};

export type ListFilesOptions = {
  prefix?: string;
  limit?: number;
  cursor?: string;
};

export type ListFilesResult = {
  files: StoredFile[];
  cursor?: string;
  hasMore: boolean;
};

export type FileStorage = {
  put(pathname: string, body: FileStorageBody, options?: PutFileOptions): Promise<StoredFile>;
  get(pathnameOrUrl: string): Promise<StoredFileContent | null>;
  getMany(pathnamesOrUrls: string[]): Promise<(StoredFileContent | null)[]>;
  delete(pathnameOrUrl: string): Promise<void>;
  list(options?: ListFilesOptions): Promise<ListFilesResult>;
};

const localRoot = path.resolve(
  process.cwd(),
  process.env.LOCAL_FILE_STORAGE_DIR ?? ".artifacts/local-blob",
);
const localPublicPath = normalizePublicPath(
  process.env.LOCAL_FILE_STORAGE_PUBLIC_PATH ?? "/uploads",
);

export function createFileStorage(
  driver: FileStorageDriver = getConfiguredDriver(),
): FileStorage {
  if (driver === "vercel") {
    return vercelBlobStorage;
  }

  return localFileStorage;
}

function getConfiguredDriver(): FileStorageDriver {
  return process.env.FILE_STORAGE_DRIVER === "vercel" ? "vercel" : "local";
}

const vercelBlobStorage: FileStorage = {
  async put(pathname, body, options = {}) {
    const blob = await put(pathname, bodyToVercelBody(body), {
      access: options.access ?? "public",
      allowOverwrite: options.allowOverwrite ?? true,
      cacheControlMaxAge: options.cacheControlMaxAge,
      contentType: options.contentType,
    });

    return {
      pathname: blob.pathname,
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      contentType: blob.contentType,
    };
  },

  async get(pathnameOrUrl) {
    const result = await get(pathnameOrUrl, { access: "public" });

    if (!result || result.statusCode === 304 || !result.stream) {
      return null;
    }

    return {
      pathname: result.blob.pathname,
      url: result.blob.url,
      downloadUrl: result.blob.downloadUrl,
      contentType: result.blob.contentType,
      size: result.blob.size,
      uploadedAt: result.blob.uploadedAt,
      body: await readableStreamToUint8Array(result.stream),
    };
  },

  async getMany(pathnamesOrUrls) {
    return Promise.all(pathnamesOrUrls.map((pathnameOrUrl) => vercelBlobStorage.get(pathnameOrUrl)));
  },

  async delete(pathnameOrUrl) {
    await del(pathnameOrUrl);
  },

  async list(options = {}) {
    const result = await list({
      cursor: options.cursor,
      limit: options.limit,
      prefix: options.prefix,
    });

    return {
      files: result.blobs.map((blob) => ({
        pathname: blob.pathname,
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      })),
      cursor: result.cursor,
      hasMore: result.hasMore,
    };
  },
};

const localFileStorage: FileStorage = {
  async put(pathname, body, options = {}) {
    const safePathname = normalizePathname(pathname);
    const filePath = getLocalFilePath(safePathname);

    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, await bodyToUint8Array(body), {
      flag: options.allowOverwrite === false ? "wx" : "w",
    });

    const fileStat = await stat(filePath);

    return {
      pathname: safePathname,
      url: getLocalUrl(safePathname),
      downloadUrl: getLocalUrl(safePathname),
      contentType: options.contentType,
      size: fileStat.size,
      uploadedAt: fileStat.mtime,
    };
  },

  async get(pathnameOrUrl) {
    const safePathname = normalizePathname(pathnameFromLocalUrl(pathnameOrUrl));
    const filePath = getLocalFilePath(safePathname);

    try {
      const [body, fileStat] = await Promise.all([readFile(filePath), stat(filePath)]);

      return {
        pathname: safePathname,
        url: getLocalUrl(safePathname),
        downloadUrl: getLocalUrl(safePathname),
        size: fileStat.size,
        uploadedAt: fileStat.mtime,
        body,
      };
    } catch (error) {
      if (isNotFoundError(error)) {
        return null;
      }

      throw error;
    }
  },

  async getMany(pathnamesOrUrls) {
    return Promise.all(pathnamesOrUrls.map((pathnameOrUrl) => localFileStorage.get(pathnameOrUrl)));
  },

  async delete(pathnameOrUrl) {
    const safePathname = normalizePathname(pathnameFromLocalUrl(pathnameOrUrl));

    await rm(getLocalFilePath(safePathname), { force: true });
  },

  async list(options = {}) {
    const prefix = options.prefix ? normalizePathname(options.prefix) : "";
    const files = await listLocalFiles(localRoot, prefix);
    const start = options.cursor ? Number(options.cursor) : 0;
    const limit = options.limit ?? files.length;
    const page = files.slice(start, start + limit);
    const next = start + page.length;

    return {
      files: page,
      cursor: next < files.length ? String(next) : undefined,
      hasMore: next < files.length,
    };
  },
};

export const fileStorage: FileStorage = createFileStorage();

function getLocalFilePath(pathname: string) {
  const filePath = path.resolve(localRoot, pathname);

  if (!filePath.startsWith(`${localRoot}${path.sep}`) && filePath !== localRoot) {
    throw new Error(`Invalid storage pathname: ${pathname}`);
  }

  return filePath;
}

function getLocalUrl(pathname: string) {
  return `${localPublicPath}/${pathname}`;
}

function normalizePathname(pathname: string) {
  const normalized = pathname.replaceAll("\\", "/").replace(/^\/+/, "");

  if (!normalized || normalized.split("/").includes("..")) {
    throw new Error(`Invalid storage pathname: ${pathname}`);
  }

  return normalized;
}

function normalizePublicPath(publicPath: string) {
  return `/${publicPath.replace(/^\/+|\/+$/g, "")}`;
}

function pathnameFromLocalUrl(pathnameOrUrl: string) {
  if (pathnameOrUrl.startsWith(localPublicPath)) {
    return pathnameOrUrl.slice(localPublicPath.length);
  }

  return pathnameOrUrl;
}

function bodyToVercelBody(body: FileStorageBody): VercelBlobBody {
  if (body instanceof Uint8Array && !Buffer.isBuffer(body)) {
    return Buffer.from(body);
  }

  return body;
}

async function bodyToUint8Array(body: FileStorageBody): Promise<Uint8Array> {
  if (typeof body === "string") {
    return Buffer.from(body);
  }

  if (body instanceof Blob) {
    return new Uint8Array(await body.arrayBuffer());
  }

  if (body instanceof ArrayBuffer) {
    return new Uint8Array(body);
  }

  if (body instanceof ReadableStream) {
    return readableStreamToUint8Array(body);
  }

  return body;
}

async function readableStreamToUint8Array(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    chunks.push(value);
    size += value.byteLength;
  }

  const body = new Uint8Array(size);
  let offset = 0;

  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return body;
}

async function listLocalFiles(root: string, prefix: string): Promise<StoredFile[]> {
  let entries;

  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (error) {
    if (isNotFoundError(error)) {
      return [];
    }

    throw error;
  }

  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(root, entry.name);

      if (entry.isDirectory()) {
        return listLocalFiles(entryPath, prefix);
      }

      if (!entry.isFile()) {
        return [];
      }

      const pathname = path.relative(localRoot, entryPath).replaceAll(path.sep, "/");

      if (prefix && !pathname.startsWith(prefix)) {
        return [];
      }

      const fileStat = await stat(entryPath);

      return [
        {
          pathname,
          url: getLocalUrl(pathname),
          downloadUrl: getLocalUrl(pathname),
          size: fileStat.size,
          uploadedAt: fileStat.mtime,
        },
      ];
    }),
  );

  return files.flat().sort((a, b) => a.pathname.localeCompare(b.pathname));
}

function isNotFoundError(error: unknown) {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
