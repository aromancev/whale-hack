import { mkdir, rename, readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { randomUUID } from "node:crypto"

const INPUT_FILE = resolve(".artifacts/cats.jsonl")
const OUTPUT_FILE = resolve(".artifacts/cases.jsonl")
const DEFAULT_COUNTRY = "nl"
const DEFAULT_CITY = "Amsterdam"
const DEFAULT_COORDINATES = {
  latitude: 52.3676,
  longitude: 4.9041,
}

function parseJsonLines(contents) {
  return contents
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line)
      } catch (error) {
        throw new Error(`Invalid JSON on line ${index + 1}: ${error.message}`)
      }
    })
}

function toIsoDateTime(value, fallback) {
  if (!value) {
    return fallback
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return fallback
  }

  return parsed.toISOString()
}

function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

function toGender(value) {
  if (typeof value !== "string") {
    return undefined
  }

  const normalized = value.trim().toLowerCase()

  if (["kater", "male", "man"].includes(normalized)) {
    return "male"
  }

  if (["poes", "female", "vrouw"].includes(normalized)) {
    return "female"
  }

  return undefined
}

function toAgeGroup(value) {
  const age = toNumber(value)

  if (age === undefined) {
    return undefined
  }

  if (age < 1) {
    return "yong"
  }

  if (age < 8) {
    return "adult"
  }

  return "senior"
}

function toColor(colors) {
  if (!Array.isArray(colors)) {
    return undefined
  }

  const filtered = colors
    .map((color) => typeof color === "string" ? color.trim() : "")
    .filter(Boolean)

  return filtered.length > 0 ? filtered.join(", ") : undefined
}

function toPhotoUrls(imageUrl) {
  return typeof imageUrl === "string" && imageUrl.trim() !== "" ? [imageUrl.trim()] : []
}

function toAddress(record) {
  const sourceLocation = record.location ?? {}
  const street = typeof sourceLocation.street === "string" && sourceLocation.street.trim() !== ""
    ? sourceLocation.street.trim()
    : undefined
  const postalCode = typeof sourceLocation.postcode === "string" && sourceLocation.postcode.trim() !== ""
    ? sourceLocation.postcode.trim()
    : undefined
  const latitude = toNumber(sourceLocation.latitude)
  const longitude = toNumber(sourceLocation.longitude)

  const coordinates = latitude !== undefined && longitude !== undefined
    ? { latitude, longitude }
    : DEFAULT_COORDINATES

  const fullAddressParts = [street, postalCode, DEFAULT_CITY].filter(Boolean)

  return {
    country: DEFAULT_COUNTRY,
    city: DEFAULT_CITY,
    street,
    postal_code: postalCode,
    full_address: fullAddressParts.length > 0 ? fullAddressParts.join(", ") : DEFAULT_CITY,
    coordinates,
  }
}

function toOwner(record) {
  const contact = record.contact ?? {}
  const fallbackId = record.id ?? randomUUID()
  const name = typeof contact.office_name === "string" && contact.office_name.trim() !== ""
    ? `${contact.office_name.trim()} contact`
    : `Mock owner ${fallbackId}`
  const email = typeof contact.email === "string" && contact.email.trim() !== ""
    ? contact.email.trim()
    : `mock-owner-${fallbackId}@example.com`
  const phoneNumber = typeof contact.phone === "string" && contact.phone.trim() !== ""
    ? contact.phone.trim()
    : undefined

  return {
    name,
    email,
    phone_number: phoneNumber,
  }
}

function toPet(record) {
  const breed = typeof record.breed === "string" && record.breed.trim() !== ""
    ? record.breed.trim()
    : "Unknown cat"
  const breedGroup = breed === "Unknown cat" ? "unknown" : breed
  const name = typeof record.name === "string" && record.name.trim() !== ""
    ? record.name.trim()
    : `Cat ${record.id ?? "unknown"}`
  const description = typeof record.description === "string" && record.description.trim() !== ""
    ? record.description.trim()
    : undefined
  const collar = typeof record.collar === "string"
    ? record.collar.trim() !== ""
    : Boolean(record.collar)
  const chipped = typeof record.chip_type === "string"
    ? record.chip_type.trim() !== "" && record.chip_type.trim().toLowerCase() !== "geen"
    : undefined

  return {
    species: "cat",
    breed,
    breed_group: breedGroup,
    photo_urls: toPhotoUrls(record.image_url),
    gender: toGender(record.sex),
    age_years: toNumber(record.age_number),
    age_group: toAgeGroup(record.age_number),
    name,
    description,
    unique_details: description,
    chipped,
    collar,
    color: toColor(record.colors),
  }
}

function normalizeCase(record) {
  const now = new Date().toISOString()
  const createdAt = toIsoDateTime(record.reported_at ?? record.scraped_at, now)
  const updatedAt = toIsoDateTime(record.scraped_at ?? record.reported_at, createdAt)
  const lostTime = toIsoDateTime(record.missing_at ?? record.reported_at, createdAt)

  return {
    id: typeof record.id === "string" && record.id.trim() !== "" ? record.id.trim() : randomUUID(),
    status: "created",
    owner: toOwner(record),
    pet: toPet(record),
    lost_time: lostTime,
    lost_place: toAddress(record),
    sightings: [],
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

async function main() {
  const input = await readFile(INPUT_FILE, "utf8")
  const records = parseJsonLines(input)
  const cases = records.map(normalizeCase)
  const contents = cases.map((petCase) => JSON.stringify(petCase)).join("\n")
  const tmpFile = `${OUTPUT_FILE}.tmp`

  await mkdir(dirname(OUTPUT_FILE), { recursive: true })
  await writeFile(tmpFile, contents ? `${contents}\n` : "")
  await rename(tmpFile, OUTPUT_FILE)

  console.log(`Wrote ${cases.length} records to ${OUTPUT_FILE}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
