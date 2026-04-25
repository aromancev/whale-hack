export type ISODateTimeString = string & { readonly __brand: "ISODateTimeString" };

export function nowAsISODateTimeString(): ISODateTimeString {
  return new Date().toISOString() as ISODateTimeString;
}

export function toISODateTimeString(value: Date | string): ISODateTimeString {
  const date = value instanceof Date ? value : new Date(value);
  const iso = date.toISOString();

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${String(value)}`);
  }

  return iso as ISODateTimeString;
}
