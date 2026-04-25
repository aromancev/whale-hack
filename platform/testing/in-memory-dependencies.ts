import type {
  FileStorage,
  FileStorageBody,
  ListFilesOptions,
  StoredFile,
  StoredFileContent,
} from "@/platform/file-storage";
import type { KvStore } from "@/platform/kv-store";

export function createInMemoryKvStore(): KvStore {
  const values = new Map<string, string>();

  return {
    async get(key) {
      return values.get(key) ?? null;
    },

    async set(key, value) {
      values.set(key, value);
    },

    async addToSet(key, value) {
      const currentValues = JSON.parse(values.get(key) ?? "[]") as string[];

      values.set(key, JSON.stringify([...new Set([...currentValues, value])]));
    },

    async removeFromSet(key, value) {
      const currentValues = JSON.parse(values.get(key) ?? "[]") as string[];

      values.set(
        key,
        JSON.stringify(currentValues.filter((currentValue) => currentValue !== value)),
      );
    },

    async getSet(key) {
      return JSON.parse(values.get(key) ?? "[]") as string[];
    },

    async delete(key) {
      values.delete(key);
    },

    async has(key) {
      return values.has(key);
    },
  };
}

export function createInMemoryFileStorage(): FileStorage {
  const files = new Map<string, StoredFileContent>();

  return {
    async put(pathname, body, options = {}) {
      const storedFile: StoredFileContent = {
        pathname,
        url: `memory://${pathname}`,
        downloadUrl: `memory://${pathname}`,
        contentType: options.contentType,
        size: getBodySize(body),
        uploadedAt: new Date(),
        body: await bodyToUint8Array(body),
      };

      if (options.allowOverwrite === false && files.has(pathname)) {
        throw new Error(`File already exists: ${pathname}`);
      }

      files.set(pathname, storedFile);

      return toStoredFile(storedFile);
    },

    async get(pathnameOrUrl) {
      return files.get(stripMemoryUrl(pathnameOrUrl)) ?? null;
    },

    async getMany(pathnamesOrUrls) {
      return pathnamesOrUrls.map((pathnameOrUrl) => files.get(stripMemoryUrl(pathnameOrUrl)) ?? null);
    },

    async delete(pathnameOrUrl) {
      files.delete(stripMemoryUrl(pathnameOrUrl));
    },

    async list(options = {}) {
      const filteredFiles = Array.from(files.values())
        .filter((file) => !options.prefix || file.pathname.startsWith(options.prefix))
        .sort((a, b) => a.pathname.localeCompare(b.pathname));
      const start = getCursorOffset(options);
      const limit = options.limit ?? filteredFiles.length;
      const page = filteredFiles.slice(start, start + limit).map(toStoredFile);
      const next = start + page.length;

      return {
        files: page,
        cursor: next < filteredFiles.length ? String(next) : undefined,
        hasMore: next < filteredFiles.length,
      };
    },
  };
}

function stripMemoryUrl(pathnameOrUrl: string) {
  return pathnameOrUrl.replace(/^memory:\/\//, "");
}

function getCursorOffset(options: ListFilesOptions) {
  if (!options.cursor) {
    return 0;
  }

  return Number(options.cursor);
}

function toStoredFile(file: StoredFileContent): StoredFile {
  return {
    pathname: file.pathname,
    url: file.url,
    downloadUrl: file.downloadUrl,
    contentType: file.contentType,
    size: file.size,
    uploadedAt: file.uploadedAt,
  };
}

function getBodySize(body: FileStorageBody) {
  if (typeof body === "string") {
    return Buffer.byteLength(body);
  }

  if (body instanceof ArrayBuffer) {
    return body.byteLength;
  }

  if (body instanceof Uint8Array) {
    return body.byteLength;
  }

  if (body instanceof Blob) {
    return body.size;
  }
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
