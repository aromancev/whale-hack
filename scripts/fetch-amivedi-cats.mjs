import {mkdir, rename, writeFile} from "node:fs/promises"
import {dirname, resolve} from "node:path"

const BASE_URL = "https://www.amivedi.nl"
const SEARCH_URL = `${BASE_URL}/umbraco/api/ZoekresultatenApi/PostZoekresultaten/`
const DETAIL_URL = `${BASE_URL}/umbraco/api/ZoekresultatenApi/GetMeldingDetail/`
const OUTPUT_FILE = resolve(".artifacts/cats.jsonl")
const CONCURRENCY = 8

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}T00:00:00`
}

function lastMonthRange() {
  const to = new Date()
  to.setHours(0, 0, 0, 0)

  const from = new Date(to)
  from.setMonth(from.getMonth() - 1)

  return {from, to}
}

async function fetchJson(url, options) {
  const response = await fetch(url, {
    ...options,
    headers: {
      accept: "application/json",
      "user-agent": "whale-hack-dataset/0.1 (+https://www.amivedi.nl/)",
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${url}`)
  }

  return response.json()
}

async function fetchSearchResults({from, to}) {
  const body = new URLSearchParams({
    CountOnly: "false",
    IsGeaccordeerd: "true",
    IsNotGeaccordeerdChb: "false",
    IsOpgelost: "false",
    CheckboxIsOpgelost: "false",
    StatusId: "1",
    Status: "1",
    DiersoortId: "2",
    DatumVermissingVan: formatDate(from),
    DatumVermissingTot: formatDate(to),
    CheckboxHasHalsband: "false",
    OnlyMeldPuntenOfVrijwilliger: "false",
    OrderColumn: "0",
    OrderDirection: "0",
    OrderFilter: "DatumInvoer Desc",
  })

  return fetchJson(SEARCH_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "x-requested-with": "XMLHttpRequest",
    },
    body,
  })
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++
      results[index] = await mapper(items[index], index)
    }
  }

  await Promise.all(
    Array.from({length: Math.min(concurrency, items.length)}, () => worker()),
  )

  return results
}

function normalizeRecord(detail, searchResult, range) {
  return {
    source: "amivedi",
    source_url: detail.detailUrl ?? `${BASE_URL}/detail/?meldingid=${detail.meldingId}`,
    scraped_at: new Date().toISOString(),
    query: {
      status: "missing",
      species: "cat",
      from: formatDate(range.from),
      to: formatDate(range.to),
    },
    id: detail.meldingId ?? searchResult.meldingId,
    status: "missing",
    species: detail.diersoortNaam ?? searchResult.diersoortNaam,
    name: detail.dierRoepnaam ?? null,
    breed: detail.rasNaam ?? null,
    sex: detail.geslachtNaam ?? null,
    neuter_status: detail.castratieNaam ?? null,
    chip_type: detail.chipTypeNaam ?? null,
    colors: [detail.kleur1Naam, detail.kleur2Naam, detail.kleur3Naam].filter(Boolean),
    coat_pattern: detail.vachtpatroonNaam ?? null,
    coat_length: detail.vachtlengteNaam ?? null,
    age_number: detail.leeftijdNum ?? null,
    age_unit: detail.tijdsEenheidNaamKort ?? null,
    collar: detail.halsbandNaam || null,
    missing_at: detail.datumVermissing ?? null,
    reported_at: detail.datumInvoer ?? null,
    resolved_at: detail.datumVermissingOpgelost ?? null,
    is_alive: detail.isLevend ?? searchResult.isLevend ?? null,
    description: detail.signalement ?? null,
    image_url: detail.dierImageName ?? null,
    location: {
      city: detail.incidentPlaats ?? null,
      postcode: detail.incidentPostcode ?? null,
      street: detail.incidentStraat ?? null,
      municipality: detail.incidentGemeente ?? null,
      province: detail.incidentProvincie ?? null,
      latitude: detail.incidentLatitude ?? searchResult.incidentLatitude ?? null,
      longitude: detail.incidentLongitude ?? searchResult.incidentLongitude ?? null,
    },
    contact: {
      office_id: detail.meldpuntID ?? null,
      office_name: detail.meldpuntNaam ?? null,
      phone: detail.meldpuntTelefoon ?? null,
      email: detail.meldpuntEmail ?? null,
    },
    raw: detail,
  }
}

async function main() {
  const range = lastMonthRange()
  const searchResults = await fetchSearchResults(range)
  const uniqueResults = Array.from(
    new Map(searchResults.map((result) => [result.meldingId, result])).values(),
  )

  const records = await mapWithConcurrency(uniqueResults, CONCURRENCY, async (result) => {
    const detail = await fetchJson(`${DETAIL_URL}${result.meldingId}`)
    return normalizeRecord(detail, result, range)
  })

  await mkdir(dirname(OUTPUT_FILE), {recursive: true})

  const tmpFile = `${OUTPUT_FILE}.tmp`
  const contents = records.map((record) => JSON.stringify(record)).join("\n")
  await writeFile(tmpFile, contents ? `${contents}\n` : "")
  await rename(tmpFile, OUTPUT_FILE)

  console.log(`Wrote ${records.length} records to ${OUTPUT_FILE}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
