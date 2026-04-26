import {
  formatAddress,
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
    color: rgb(0.72, 0.11, 0.11),
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
    ["LAST SEEN", formatAddress(petCase?.lost_place)],
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
    color: rgb(0.97, 0.95, 0.92),
  });

  page.drawRectangle({
    x: PAGE_MARGIN - 6,
    y: PAGE_MARGIN - 6,
    width: PAGE_WIDTH - PAGE_MARGIN * 2 + 12,
    height: PAGE_HEIGHT - PAGE_MARGIN * 2 + 12,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.9, 0.88, 0.84),
    borderWidth: 1,
  });
}

function drawPhotoBox({
  page,
  photo,
  x,
  y,
  width,
  height,
  font,
}: {
  page: PDFPageLike;
  photo: EmbeddedPhoto | null;
  x: number;
  y: number;
  width: number;
  height: number;
  font: FontLike;
}) {
  page.drawRectangle({
    x,
    y,
    width,
    height,
    color: rgb(0.98, 0.97, 0.95),
    borderColor: rgb(0.9, 0.86, 0.81),
    borderWidth: 1,
  });

  if (!photo) {
    page.drawText("PHOTO UNAVAILABLE", {
      x: x + 18,
      y: y + height / 2 - 6,
      size: 14,
      font,
      color: rgb(0.55, 0.58, 0.62),
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
    color: rgb(0.42, 0.45, 0.5),
  });

  return drawWrappedText({
    page,
    text: value,
    x,
    y: y - 28,
    width,
    size: valueSize,
    lineHeight: valueSize + 4,
    font: boldFont,
    color: rgb(0.07, 0.09, 0.13),
  }) - 6;
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

    page.drawRectangle({
      x: cardX,
      y: cardY,
      width: columnWidth,
      height: rowHeight,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.9, 0.91, 0.92),
      borderWidth: 1,
    });

    page.drawText(label, {
      x: cardX + 10,
      y: cardY + rowHeight - 16,
      size: 9,
      font: boldFont,
      color: rgb(0.42, 0.45, 0.5),
    });

    drawWrappedText({
      page,
      text: value,
      x: cardX + 10,
      y: cardY + rowHeight - 32,
      width: columnWidth - 20,
      size: 11,
      lineHeight: 13,
      font,
      color: rgb(0.07, 0.09, 0.13),
      maxLines: 2,
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
  page.drawRectangle({
    x,
    y: y - height,
    width,
    height,
    color: rgb(0.97, 0.98, 0.99),
  });

  page.drawText(title, {
    x: x + 12,
    y: y - 18,
    size: 9,
    font: boldFont,
    color: rgb(0.42, 0.45, 0.5),
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
    color: rgb(0.07, 0.09, 0.13),
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

  page.drawRectangle({
    x,
    y: y - panelHeight,
    width,
    height: panelHeight,
    color: rgb(0.98, 0.98, 0.99),
    borderColor: rgb(0.9, 0.91, 0.92),
    borderWidth: 1,
  });

  page.drawText("SCAN TO OPEN CASE", {
    x: x + 14,
    y: y - 22,
    size: 11,
    font: boldFont,
    color: rgb(0.22, 0.25, 0.32),
  });

  page.drawRectangle({
    x: x + 14,
    y: y - 206,
    width: width - 28,
    height: 160,
    color: rgb(1, 1, 1),
  });

  page.drawImage(qrCode.image, {
    x: x + 26,
    y: y - 194,
    width: width - 52,
    height: width - 52,
  });

  const contactY = y - 232;
  page.drawRectangle({
    x: x + 14,
    y: contactY - 140,
    width: width - 28,
    height: 140,
    color: rgb(0.07, 0.09, 0.13),
  });

  page.drawText("CONTACT", {
    x: x + 26,
    y: contactY - 16,
    size: 10,
    font: boldFont,
    color: rgb(0.8, 0.84, 0.9),
  });

  drawWrappedText({
    page,
    text: ownerName,
    x: x + 26,
    y: contactY - 38,
    width: width - 52,
    size: 18,
    lineHeight: 20,
    font: boldFont,
    color: rgb(1, 1, 1),
    maxLines: 2,
  });

  drawWrappedText({
    page,
    text: ownerEmail,
    x: x + 26,
    y: contactY - 82,
    width: width - 52,
    size: 11,
    lineHeight: 14,
    font,
    color: rgb(0.9, 0.92, 0.95),
    maxLines: 3,
  });

  if (ownerPhone) {
    drawWrappedText({
      page,
      text: ownerPhone,
      x: x + 26,
      y: contactY - 122,
      width: width - 52,
      size: 11,
      lineHeight: 14,
      font,
      color: rgb(0.9, 0.92, 0.95),
      maxLines: 2,
    });
  }

  page.drawRectangle({
    x: x + 14,
    y: PAGE_MARGIN + 14,
    width: width - 28,
    height: 64,
    borderColor: rgb(0.82, 0.85, 0.88),
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
    color: rgb(0.3, 0.33, 0.38),
    maxLines: 3,
  });
}

async function buildQrCode(pdfDoc: PDFDocument, publicCaseUrl: string) {
  const dataUrl = await QRCode.toDataURL(publicCaseUrl, {
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

    const pngBytes = await sharp(Buffer.from(bytes))
      .rotate()
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
