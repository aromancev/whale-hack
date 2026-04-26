import {
  formatLostTime,
  formatValue,
} from "@/app/public-case/public-case-utils";
import { fileStorage } from "@/platform/file-storage";
import { casesService } from "@/service/cases";
import { PDFDocument, PDFFont, PDFImage, PDFPage, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import sharp from "sharp";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const PAGE_MARGIN = 36;
const CONTENT_GAP = 18;
const RIGHT_COLUMN_WIDTH = 170;
const LEFT_COLUMN_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2 - RIGHT_COLUMN_WIDTH - CONTENT_GAP;

const COLORS = {
  page: rgb(1, 0.97, 0.93),
  sheet: rgb(1, 1, 1),
  ink: rgb(0.18, 0.15, 0.12),
  muted: rgb(0.45, 0.4, 0.36),
  border: rgb(0.91, 0.84, 0.75),
  orange: rgb(0.82, 0.48, 0.28),
  orangeSoft: rgb(0.96, 0.78, 0.65),
  green: rgb(0.14, 0.34, 0.26),
  greenSoft: rgb(0.75, 0.91, 0.84),
  greenPale: rgb(0.95, 0.98, 0.96),
  cream: rgb(0.98, 0.93, 0.86),
  red: rgb(0.72, 0.11, 0.11),
};

export async function GET(
  request: Request,
  context: RouteContext<"/case/[caseId]/flyer/pdf">,
) {
  const { caseId } = await context.params;
  const petCase = await casesService.get(caseId);

  if (!petCase) {
    return new Response("Case not found.", { status: 404 });
  }

  const publicCaseUrl = new URL(`/public-case/${encodeURIComponent(caseId)}`, request.url).toString();
  const pdfBytes = await buildFlyerPdf({
    petCase,
    publicCaseUrl,
    origin: new URL(request.url).origin,
  });

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="missing-cat-${caseId}.pdf"`,
      "cache-control": "no-store",
    },
  });
}

async function buildFlyerPdf({
  petCase,
  publicCaseUrl,
  origin,
}: {
  petCase: NonNullable<Awaited<ReturnType<typeof casesService.get>>>;
  publicCaseUrl: string;
  origin: string;
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pet = petCase?.pet;
  const petName = pet?.name?.trim() || "Missing cat";

  drawBackground(page);

  const qrCode = await buildQrCode(pdfDoc, publicCaseUrl);
  const photo = await loadPhoto(pdfDoc, pet?.photo_urls[0], origin);

  let cursorY = PAGE_HEIGHT - PAGE_MARGIN;
  cursorY = drawTextBlock({
    page,
    text: "MISSING",
    x: PAGE_MARGIN,
    y: cursorY,
    size: 32,
    font: boldFont,
    color: COLORS.red,
  });

  const photoTop = cursorY - 8;
  const photoHeight = 330;
  drawPhotoBox({
    page,
    photo,
    x: PAGE_MARGIN,
    y: photoTop - photoHeight,
    width: LEFT_COLUMN_WIDTH,
    height: photoHeight,
    petName,
    regularFont: font,
    font: boldFont,
  });

  cursorY = photoTop - photoHeight - 18;
  cursorY = drawLabelValue({
    page,
    label: "PET NAME",
    value: petName,
    x: PAGE_MARGIN,
    y: cursorY,
    width: LEFT_COLUMN_WIDTH,
    boldFont,
    valueSize: 26,
  });

  const facts = [
    ["LAST SEEN", petCase?.lost_place?.city || "City unknown"],
    ["LOST", formatLostTime(petCase?.lost_time)],
    ["COLOR", formatValue(pet?.color)],
    ["BREED", formatValue(pet?.breed)],
    ["SIZE", formatValue(pet?.size)],
    ["REWARD", petCase?.reward || "Not listed"],
  ] as const;

  cursorY -= 4;
  cursorY = drawFacts({
    page,
    facts,
    x: PAGE_MARGIN,
    y: cursorY,
    width: LEFT_COLUMN_WIDTH,
    font,
    boldFont,
  });

  if (pet?.unique_details?.trim()) {
    drawNotes({
      page,
      title: "DISTINGUISHING DETAILS",
      text: pet.unique_details,
      x: PAGE_MARGIN,
      y: cursorY - 16,
      width: LEFT_COLUMN_WIDTH,
      font,
      boldFont,
    });
  }

  drawSidebar({
    page,
    qrCode,
    x: PAGE_MARGIN + LEFT_COLUMN_WIDTH + CONTENT_GAP,
    y: PAGE_HEIGHT - PAGE_MARGIN,
    width: RIGHT_COLUMN_WIDTH,
    ownerName: petCase?.owner.name || "Owner",
    ownerEmail: petCase?.owner.email || "",
    ownerPhone: petCase?.owner.phone_number,
    font,
    boldFont,
  });

  return pdfDoc.save();
}

function drawBackground(page: PDFPageLike) {
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: COLORS.page,
  });

  page.drawEllipse({
    x: -12,
    y: PAGE_HEIGHT - 92,
    xScale: 92,
    yScale: 76,
    color: COLORS.orangeSoft,
    opacity: 0.55,
  });

  page.drawEllipse({
    x: PAGE_WIDTH - 52,
    y: PAGE_HEIGHT - 240,
    xScale: 112,
    yScale: 90,
    color: COLORS.greenSoft,
    opacity: 0.6,
  });

  page.drawEllipse({
    x: PAGE_WIDTH / 2,
    y: 42,
    xScale: 118,
    yScale: 58,
    color: rgb(1, 0.9, 0.66),
    opacity: 0.55,
  });

  drawRoundedRect(page, {
    x: PAGE_MARGIN - 6,
    y: PAGE_MARGIN - 6,
    width: PAGE_WIDTH - PAGE_MARGIN * 2 + 12,
    height: PAGE_HEIGHT - PAGE_MARGIN * 2 + 12,
    radius: 18,
    color: COLORS.sheet,
    borderColor: COLORS.border,
    borderWidth: 2,
  });

  page.drawRectangle({
    x: PAGE_MARGIN - 6,
    y: PAGE_MARGIN - 11,
    width: PAGE_WIDTH - PAGE_MARGIN * 2 + 12,
    height: 5,
    color: COLORS.orange,
  });
}

function drawPhotoBox({
  page,
  photo,
  x,
  y,
  width,
  height,
  petName,
  regularFont,
  font,
}: {
  page: PDFPageLike;
  photo: EmbeddedPhoto | null;
  x: number;
  y: number;
  width: number;
  height: number;
  petName: string;
  regularFont: FontLike;
  font: FontLike;
}) {
  drawRoundedRect(page, {
    x,
    y,
    width,
    height,
    radius: 18,
    color: COLORS.greenPale,
    borderColor: COLORS.border,
    borderWidth: 2,
  });

  if (!photo) {
    drawCatPlaceholder({
      page,
      x,
      y,
      width,
      height,
      title: "Photo coming soon",
      subtitle: petName,
      font: regularFont,
      boldFont: font,
    });
    return;
  }

  const fitted = fitRect({
    sourceWidth: photo.width,
    sourceHeight: photo.height,
    maxWidth: width - 20,
    maxHeight: height - 20,
  });

  page.drawImage(photo.image, {
    x: x + (width - fitted.width) / 2,
    y: y + (height - fitted.height) / 2,
    width: fitted.width,
    height: fitted.height,
  });
}

function drawCatPlaceholder({
  page,
  x,
  y,
  width,
  height,
  title,
  subtitle,
  font,
  boldFont,
}: {
  page: PDFPageLike;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  subtitle: string;
  font: FontLike;
  boldFont: FontLike;
}) {
  const centerX = x + width / 2;
  const centerY = y + height / 2 + 14;

  drawRoundedRect(page, {
    x: x + 32,
    y: y + 32,
    width: width - 64,
    height: height - 64,
    radius: 22,
    color: rgb(1, 1, 1),
    borderColor: COLORS.orangeSoft,
    borderWidth: 1.5,
  });

  drawOrangeCatPlaceholder({
    page,
    centerX,
    centerY: centerY + 30,
  });

  drawCenteredText({
    page,
    text: title.toUpperCase(),
    centerX,
    y: centerY - 36,
    size: 13,
    font: boldFont,
    color: COLORS.ink,
  });
  drawCenteredText({
    page,
    text: subtitle,
    centerX,
    y: centerY - 56,
    size: 11,
    font,
    color: COLORS.muted,
  });
}

function drawOrangeCatPlaceholder({
  page,
  centerX,
  centerY,
}: {
  page: PDFPageLike;
  centerX: number;
  centerY: number;
}) {
  page.drawSvgPath([
    `M ${centerX - 43} ${centerY + 3}`,
    `L ${centerX - 34} ${centerY + 52}`,
    `Q ${centerX - 22} ${centerY + 35} ${centerX - 12} ${centerY + 23}`,
    "Z",
  ].join(" "), {
    color: COLORS.orange,
    borderColor: COLORS.orange,
    borderWidth: 1,
  });
  page.drawSvgPath([
    `M ${centerX + 12} ${centerY + 23}`,
    `Q ${centerX + 22} ${centerY + 35} ${centerX + 34} ${centerY + 52}`,
    `L ${centerX + 43} ${centerY + 3}`,
    "Z",
  ].join(" "), {
    color: COLORS.orange,
    borderColor: COLORS.orange,
    borderWidth: 1,
  });
  page.drawEllipse({
    x: centerX,
    y: centerY,
    xScale: 42,
    yScale: 34,
    color: COLORS.orange,
  });
  page.drawCircle({ x: centerX - 15, y: centerY + 5, size: 3, color: COLORS.ink });
  page.drawCircle({ x: centerX + 15, y: centerY + 5, size: 3, color: COLORS.ink });
  page.drawEllipse({
    x: centerX,
    y: centerY - 8,
    xScale: 4,
    yScale: 3,
    color: COLORS.ink,
  });
  page.drawLine({ start: { x: centerX - 7, y: centerY - 10 }, end: { x: centerX - 24, y: centerY - 7 }, thickness: 1, color: COLORS.ink });
  page.drawLine({ start: { x: centerX - 7, y: centerY - 15 }, end: { x: centerX - 25, y: centerY - 17 }, thickness: 1, color: COLORS.ink });
  page.drawLine({ start: { x: centerX + 7, y: centerY - 10 }, end: { x: centerX + 24, y: centerY - 7 }, thickness: 1, color: COLORS.ink });
  page.drawLine({ start: { x: centerX + 7, y: centerY - 15 }, end: { x: centerX + 25, y: centerY - 17 }, thickness: 1, color: COLORS.ink });
}

function drawLabelValue({
  page,
  label,
  value,
  x,
  y,
  width,
  boldFont,
  valueSize,
}: {
  page: PDFPageLike;
  label: string;
  value: string;
  x: number;
  y: number;
  width: number;
  boldFont: FontLike;
  valueSize: number;
}) {
  page.drawText(label, {
    x,
    y: y - 10,
    size: 10,
    font: boldFont,
    color: COLORS.muted,
  });

  return drawWrappedText({
    page,
    text: value,
    x,
    y: y - 40,
    width,
    size: valueSize,
    lineHeight: valueSize + 4,
    font: boldFont,
    color: COLORS.ink,
  }) - 2;
}

function drawFacts({
  page,
  facts,
  x,
  y,
  width,
  font,
  boldFont,
}: {
  page: PDFPageLike;
  facts: readonly (readonly [string, string])[];
  x: number;
  y: number;
  width: number;
  font: FontLike;
  boldFont: FontLike;
}) {
  const gap = 10;
  const columnWidth = (width - gap) / 2;
  const rowHeight = 62;
  let lowestY = y;

  for (const [index, [label, value]] of facts.entries()) {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const cardX = x + column * (columnWidth + gap);
    const cardY = y - row * (rowHeight + gap) - rowHeight;
    lowestY = Math.min(lowestY, cardY);

    drawRoundedRect(page, {
      x: cardX,
      y: cardY,
      width: columnWidth,
      height: rowHeight,
      radius: 12,
      color: rgb(1, 0.99, 0.97),
      borderColor: COLORS.border,
      borderWidth: 1,
    });

    page.drawText(label, {
      x: cardX + 10,
      y: cardY + rowHeight - 16,
      size: 9,
      font: boldFont,
      color: COLORS.muted,
    });

    const isLastSeen = label === "LAST SEEN";

    drawWrappedText({
      page,
      text: value,
      x: cardX + 10,
      y: cardY + rowHeight - 32,
      width: columnWidth - 20,
      size: isLastSeen ? 10 : 11,
      lineHeight: isLastSeen ? 11 : 13,
      font,
      color: COLORS.ink,
      maxLines: isLastSeen ? undefined : 2,
    });
  }

  return lowestY;
}

function drawNotes({
  page,
  title,
  text,
  x,
  y,
  width,
  font,
  boldFont,
}: {
  page: PDFPageLike;
  title: string;
  text: string;
  x: number;
  y: number;
  width: number;
  font: FontLike;
  boldFont: FontLike;
}) {
  const height = 96;
  drawRoundedRect(page, {
    x,
    y: y - height,
    width,
    height,
    radius: 14,
    color: COLORS.cream,
  });

  page.drawText(title, {
    x: x + 12,
    y: y - 18,
    size: 9,
    font: boldFont,
    color: COLORS.muted,
  });

  drawWrappedText({
    page,
    text,
    x: x + 12,
    y: y - 36,
    width: width - 24,
    size: 11,
    lineHeight: 14,
    font,
    color: COLORS.ink,
    maxLines: 4,
  });
}

function drawSidebar({
  page,
  qrCode,
  x,
  y,
  width,
  ownerName,
  ownerEmail,
  ownerPhone,
  font,
  boldFont,
}: {
  page: PDFPageLike;
  qrCode: EmbeddedPhoto;
  x: number;
  y: number;
  width: number;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  font: FontLike;
  boldFont: FontLike;
}) {
  const panelHeight = PAGE_HEIGHT - PAGE_MARGIN * 2;

  drawRoundedRect(page, {
    x,
    y: y - panelHeight,
    width,
    height: panelHeight,
    radius: 16,
    color: rgb(1, 0.98, 0.95),
    borderColor: COLORS.border,
    borderWidth: 2,
  });

  page.drawText("SCAN TO OPEN CASE", {
    x: x + 14,
    y: y - 22,
    size: 11,
    font: boldFont,
    color: COLORS.green,
  });

  drawRoundedRect(page, {
    x: x + 14,
    y: y - 206,
    width: width - 28,
    height: 160,
    radius: 14,
    color: rgb(1, 1, 1),
    borderColor: COLORS.border,
    borderWidth: 1,
  });

  drawRoundedRect(page, {
    x: x + 22,
    y: y - 198,
    width: width - 44,
    height: width - 44,
    radius: 12,
    color: COLORS.greenPale,
    borderColor: COLORS.greenSoft,
    borderWidth: 1,
  });

  const qrX = x + 26;
  const qrY = y - 194;
  const qrSize = width - 52;
  page.drawImage(qrCode.image, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  const contactY = y - 232;
  drawRoundedRect(page, {
    x: x + 14,
    y: contactY - 140,
    width: width - 28,
    height: 140,
    radius: 14,
    color: COLORS.greenSoft,
    borderColor: COLORS.green,
    borderWidth: 1,
  });

  drawRoundedRect(page, {
    x: x + 20,
    y: contactY - 134,
    width: width - 40,
    height: 128,
    radius: 10,
    borderColor: rgb(1, 1, 1),
    borderWidth: 1.5,
  });

  page.drawText("CONTACT", {
    x: x + 26,
    y: contactY - 16,
    size: 10,
    font: boldFont,
    color: COLORS.green,
  });

  const ownerBottom = drawWrappedText({
    page,
    text: ownerName,
    x: x + 26,
    y: contactY - 38,
    width: width - 52,
    size: 18,
    lineHeight: 20,
    font: boldFont,
    color: COLORS.ink,
    maxLines: 2,
  });

  const emailBottom = drawWrappedText({
    page,
    text: ownerEmail,
    x: x + 26,
    y: ownerBottom - 8,
    width: width - 52,
    size: 11,
    lineHeight: 14,
    font,
    color: COLORS.green,
    maxLines: 3,
  });

  if (ownerPhone) {
    drawWrappedText({
      page,
      text: ownerPhone,
      x: x + 26,
      y: emailBottom - 8,
      width: width - 52,
      size: 11,
      lineHeight: 14,
      font,
      color: COLORS.green,
      maxLines: 2,
    });
  }

  drawRoundedRect(page, {
    x: x + 14,
    y: PAGE_MARGIN + 14,
    width: width - 28,
    height: 64,
    radius: 12,
    borderColor: COLORS.orangeSoft,
    borderWidth: 1,
  });

  drawWrappedText({
    page,
    text: "If you saw this cat, scan the QR code or use the contact details above.",
    x: x + 24,
    y: PAGE_MARGIN + 58,
    width: width - 48,
    size: 10,
    lineHeight: 13,
    font,
    color: COLORS.muted,
    maxLines: 3,
  });
}

async function buildQrCode(pdfDoc: PDFDocument, publicCaseUrl: string) {
  const dataUrl = await QRCode.toDataURL(publicCaseUrl, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 256,
    color: {
      dark: "#1f2937",
      light: "#ffffff",
    },
  });

  const bytes = decodeDataUrl(dataUrl);
  const image = await pdfDoc.embedPng(bytes);

  return { image, width: image.width, height: image.height } satisfies EmbeddedPhoto;
}

async function loadPhoto(pdfDoc: PDFDocument, photoUrl: string | undefined, origin: string) {
  if (!photoUrl) {
    return null;
  }

  try {
    let bytes: Uint8Array;

    if (photoUrl.startsWith("/")) {
      const storedFile = await fileStorage.get(photoUrl);
      if (!storedFile) {
        return null;
      }
      bytes = storedFile.body;
    } else {
      const absoluteUrl = photoUrl.startsWith("http://") || photoUrl.startsWith("https://")
        ? photoUrl
        : new URL(photoUrl, origin).toString();
      const response = await fetch(absoluteUrl, { cache: "no-store" });
      if (!response.ok) {
        return null;
      }
      bytes = new Uint8Array(await response.arrayBuffer());
    }

    const normalizedPhoto = sharp(Buffer.from(bytes)).rotate();
    const metadata = await normalizedPhoto.metadata();
    const imageWidth = metadata.width ?? 1;
    const imageHeight = metadata.height ?? 1;
    const radius = Math.max(16, Math.round(Math.min(imageWidth, imageHeight) * 0.045));
    const roundedMask = Buffer.from(
      `<svg width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="${imageWidth}" height="${imageHeight}" rx="${radius}" ry="${radius}" fill="white"/></svg>`,
    );
    const pngBytes = await normalizedPhoto
      .ensureAlpha()
      .composite([{ input: roundedMask, blend: "dest-in" }])
      .png()
      .toBuffer();
    const image = await pdfDoc.embedPng(pngBytes);

    return { image, width: image.width, height: image.height } satisfies EmbeddedPhoto;
  } catch {
    return null;
  }
}

function drawTextBlock({
  page,
  text,
  x,
  y,
  size,
  font,
  color,
}: {
  page: PDFPageLike;
  text: string;
  x: number;
  y: number;
  size: number;
  font: FontLike;
  color: ReturnType<typeof rgb>;
}) {
  page.drawText(text, {
    x,
    y: y - size,
    size,
    font,
    color,
  });

  return y - size;
}

function drawWrappedText({
  page,
  text,
  x,
  y,
  width,
  size,
  lineHeight,
  font,
  color,
  maxLines,
}: {
  page: PDFPageLike;
  text: string;
  x: number;
  y: number;
  width: number;
  size: number;
  lineHeight: number;
  font: FontLike;
  color: ReturnType<typeof rgb>;
  maxLines?: number;
}) {
  const lines = wrapText(text, width, size, font, maxLines);

  for (const [index, line] of lines.entries()) {
    page.drawText(line, {
      x,
      y: y - index * lineHeight,
      size,
      font,
      color,
    });
  }

  return y - lines.length * lineHeight;
}

function drawCenteredText({
  page,
  text,
  centerX,
  y,
  size,
  font,
  color,
}: {
  page: PDFPageLike;
  text: string;
  centerX: number;
  y: number;
  size: number;
  font: FontLike;
  color: ReturnType<typeof rgb>;
}) {
  page.drawText(text, {
    x: centerX - font.widthOfTextAtSize(text, size) / 2,
    y,
    size,
    font,
    color,
  });
}

function drawRoundedRect(
  page: PDFPageLike,
  {
    x,
    y,
    width,
    height,
    radius,
    color,
    borderColor,
    borderWidth,
  }: {
    x: number;
    y: number;
    width: number;
    height: number;
    radius: number;
    color?: ReturnType<typeof rgb>;
    borderColor?: ReturnType<typeof rgb>;
    borderWidth?: number;
  },
) {
  const r = Math.min(radius, width / 2, height / 2);
  const path = [
    `M ${x + r} ${y}`,
    `L ${x + width - r} ${y}`,
    `Q ${x + width} ${y} ${x + width} ${y + r}`,
    `L ${x + width} ${y + height - r}`,
    `Q ${x + width} ${y + height} ${x + width - r} ${y + height}`,
    `L ${x + r} ${y + height}`,
    `Q ${x} ${y + height} ${x} ${y + height - r}`,
    `L ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    "Z",
  ].join(" ");

  page.drawSvgPath(path, {
    color,
    borderColor,
    borderWidth,
  });
}

function wrapText(
  text: string,
  width: number,
  size: number,
  font: FontLike,
  maxLines?: number,
) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [""];
  }

  const lines: string[] = [];
  let currentLine = words[0];

  for (const word of words.slice(1)) {
    const nextLine = `${currentLine} ${word}`;
    if (font.widthOfTextAtSize(nextLine, size) <= width) {
      currentLine = nextLine;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;
  }

  lines.push(currentLine);

  if (!maxLines || lines.length <= maxLines) {
    return lines;
  }

  const truncated = lines.slice(0, maxLines);
  let lastLine = truncated[maxLines - 1] || "";
  while (`${lastLine}...` && font.widthOfTextAtSize(`${lastLine}...`, size) > width && lastLine.includes(" ")) {
    lastLine = lastLine.slice(0, lastLine.lastIndexOf(" "));
  }
  truncated[maxLines - 1] = `${lastLine}...`;
  return truncated;
}

function fitRect({
  sourceWidth,
  sourceHeight,
  maxWidth,
  maxHeight,
}: {
  sourceWidth: number;
  sourceHeight: number;
  maxWidth: number;
  maxHeight: number;
}) {
  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
  return {
    width: sourceWidth * scale,
    height: sourceHeight * scale,
  };
}

function decodeDataUrl(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] || "";
  return Uint8Array.from(Buffer.from(base64, "base64"));
}

type EmbeddedPhoto = {
  image: PDFImage;
  width: number;
  height: number;
};

type FontLike = PDFFont;
type PDFPageLike = PDFPage;
