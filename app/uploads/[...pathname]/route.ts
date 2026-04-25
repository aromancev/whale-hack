import { fileStorage } from "@/platform/file-storage";

export async function GET(
  _request: Request,
  context: RouteContext<"/uploads/[...pathname]">,
) {
  const { pathname } = await context.params;
  const file = await fileStorage.get(pathname.join("/"));

  if (!file) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(Buffer.from(file.body), {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(file.body.byteLength),
      "Content-Type": file.contentType ?? getContentType(file.pathname),
    },
  });
}

function getContentType(pathname: string) {
  const extension = pathname.split(".").pop()?.toLowerCase();

  if (extension === "png") {
    return "image/png";
  }

  if (extension === "gif") {
    return "image/gif";
  }

  if (extension === "webp") {
    return "image/webp";
  }

  if (extension === "svg") {
    return "image/svg+xml";
  }

  return "image/jpeg";
}
