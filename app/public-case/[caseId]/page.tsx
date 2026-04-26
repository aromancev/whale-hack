/* eslint-disable @next/next/no-img-element */
import { HomeButton } from "@/components/home-button";
import { PublicCaseEmailButton } from "@/components/public-case-email-button";
import { CaseSchema, type Address, type Case } from "@/domain/case";
import { CalendarDays, Cat, MapPin, Phone, ShieldCheck } from "lucide-react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

export default async function PublicCasePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const petCase = await getPublicCase(caseId);

  if (!petCase) {
    notFound();
  }

  const pet = petCase.pet;
  const petName = pet?.name?.trim() || "Missing cat";
  const photoUrl = pet?.photo_urls[0];

  return (
    <main className="relative min-h-svh overflow-hidden bg-[#fff8ec] px-4 py-5 text-[#2d251f] sm:px-6 sm:py-8">
      <div className="absolute -left-24 top-10 size-64 rounded-full bg-[#f8c8a7]/60 blur-3xl" />
      <div className="absolute -right-20 top-52 size-72 rounded-full bg-[#bfe8d5]/70 blur-3xl" />
      <div className="absolute bottom-0 left-1/2 size-80 -translate-x-1/2 rounded-full bg-[#ffe6a8]/70 blur-3xl" />

      <HomeButton className="text-[#7b563e] ring-[#efd8bd] focus-visible:ring-[#e58d57]/30" />

      <section className="relative mx-auto max-w-4xl pt-16 sm:pt-20">
        <div className="overflow-hidden rounded-[2rem] border-2 border-[#e8d7be] bg-white/85 shadow-[0_18px_0_#e7b888]">
          {photoUrl ? (
            <div className="p-4 sm:p-5">
              <div className="flex h-72 items-center justify-center rounded-[1.5rem] bg-[#f3fbf5] sm:h-96">
                <img
                  alt={`${petName} photo`}
                  className="max-h-full max-w-full rounded-[1.25rem] object-contain"
                  src={photoUrl}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-56 flex-col items-center justify-center gap-3 bg-[#f3fbf5] text-[#8ebaa5] sm:h-72">
              <Cat className="size-20" />
              <span className="text-sm font-black uppercase tracking-wide">
                Photo coming soon
              </span>
            </div>
          )}

          <div className="p-5 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#bfe8d5] px-3 py-1 text-xs font-black uppercase tracking-wide text-[#245643]">
                  <ShieldCheck className="size-3.5" />
                  Public missing pet case
                </span>
                <h1 className="mt-4 text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
                  {petName}
                </h1>
                <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-[#74675d]">
                  If this looks like the cat you found, copy the owner&apos;s email
                  and reach out with where and when you saw them.
                </p>
              </div>
              <PublicCaseEmailButton email={petCase.owner.email} />
            </div>

            <dl className="mt-8 grid gap-3 sm:grid-cols-2">
              <InfoCard label="Owner" value={petCase.owner.name} />
              <InfoCard label="Email" value={petCase.owner.email} />
              {petCase.owner.phone_number ? (
                <InfoCard icon={<Phone className="size-4" />} label="Phone" value={petCase.owner.phone_number} />
              ) : null}
              <InfoCard icon={<CalendarDays className="size-4" />} label="Lost" value={formatLostTime(petCase.lost_time)} />
              <InfoCard icon={<MapPin className="size-4" />} label="Last seen" value={formatAddress(petCase.lost_place)} />
              <InfoCard label="Reward" value={petCase.reward || "Not listed"} />
              <InfoCard label="Breed" value={formatValue(pet?.breed)} />
              <InfoCard label="Color" value={formatValue(pet?.color)} />
              <InfoCard label="Gender" value={formatValue(pet?.gender)} />
              <InfoCard label="Size" value={formatValue(pet?.size)} />
            </dl>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <TextCard title="Appearance" text={formatAppearance(pet?.appearance)} />
              <TextCard title="Unique details" text={pet?.unique_details} />
              <TextCard title="Health info" text={pet?.health_info} />
              <TextCard title="Behavior" text={pet?.behavior} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

async function getPublicCase(caseId: string) {
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

function InfoCard({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#dceadf] bg-white p-4">
      <dt className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#5f796b]">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-sm font-bold text-[#20362b]">{value}</dd>
    </div>
  );
}

function TextCard({ title, text }: { title: string; text?: string }) {
  return (
    <section className="rounded-2xl bg-[#f3fbf5] p-5">
      <h2 className="text-xs font-black uppercase tracking-wide text-[#245643]">
        {title}
      </h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#20362b]">
        {text?.trim() || "Not listed"}
      </p>
    </section>
  );
}

function formatLostTime(value?: string) {
  if (!value) {
    return "Not listed";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatAddress(address?: Address) {
  if (!address) {
    return "Not listed";
  }

  return [address.full_address, address.district, address.city, address.country]
    .filter(Boolean)
    .join(", ") || "Not listed";
}

function formatValue(value?: string) {
  if (!value) {
    return "Not listed";
  }

  return humanizeValue(value);
}

function formatAppearance(value?: string) {
  if (!value?.trim()) {
    return undefined;
  }

  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => (/^[a-z]+(?:_[a-z]+)*$/.test(part) ? humanizeValue(part) : part))
    .join(", ");
}

function humanizeValue(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((word, index) => {
      if (index > 0 && word === "and") {
        return word;
      }

      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}
