import { CaseSchema, type Address, type Case } from "@/domain/case";
import { headers } from "next/headers";

export async function getPublicCase(caseId: string) {
  const requestHeaders = await headers();
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const host = requestHeaders.get("host");

  if (!host) {
    return null;
  }

  const response = await fetch(
    `${protocol}://${host}/api/cases/${encodeURIComponent(caseId)}`,
    { cache: "no-store" },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Unable to load public case.");
  }

  const body = (await response.json()) as { case?: unknown };

  return CaseSchema.parse(body.case) satisfies Case;
}

export async function getPublicCaseUrl(caseId: string) {
  const requestHeaders = await headers();
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const host = requestHeaders.get("host");

  if (!host) {
    return null;
  }

  return `${protocol}://${host}/public-case/${encodeURIComponent(caseId)}`;
}

export function formatLostTime(value?: string) {
  if (!value) {
    return "Not listed";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatAddress(address?: Address) {
  if (!address) {
    return "Not listed";
  }

  return [address.full_address, address.district, address.city, address.country]
    .filter(Boolean)
    .join(", ") || "Not listed";
}

export function formatValue(value?: string) {
  if (!value) {
    return "Not listed";
  }

  return value
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
