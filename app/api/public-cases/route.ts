import { CountrySchema } from "@/domain/case";
import { casesService } from "@/service/cases";

const DEFAULT_COUNTRY = "nl";
const DEFAULT_CITY = "Amsterdam";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const countryResult = CountrySchema.safeParse(
    url.searchParams.get("country") ?? DEFAULT_COUNTRY,
  );
  const city = url.searchParams.get("city")?.trim() || DEFAULT_CITY;

  if (!countryResult.success) {
    return Response.json({ error: "Unsupported country." }, { status: 400 });
  }

  //const cases = await casesService.getOpenCases(countryResult.data, city);


  return Response.json({ cases: [] });
}
