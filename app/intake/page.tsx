import { IntakePage } from "@/app/page";

export default async function MissingCatIntakePage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string | string[] }>;
}) {
  const { step } = await searchParams;

  return <IntakePage initialStep={parseStepParam(step)} />;
}

function parseStepParam(value?: string | string[]) {
  const step = Array.isArray(value) ? value[0] : value;
  const parsed = Number(step);

  return Number.isInteger(parsed) ? parsed : undefined;
}
