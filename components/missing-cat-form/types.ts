import type { Address } from "@/domain/case";
import type { Owner } from "@/domain/owner";
import type { Pet } from "@/domain/pets";

export type FieldErrorKey = "owner.name" | "owner.email" | "pet.name" | "pet.gender" | "lostDate" | "lost_place.city";

export type UpdateOwner = <Key extends keyof Owner>(key: Key, value: Owner[Key]) => void;

export type UpdatePet = <Key extends keyof Pet>(key: Key, value: Pet[Key]) => void;

export type UpdateLostPlace = (key: keyof Omit<Address, "coordinates">, value: string) => void;

export type UpdateLostPlaceFromMap = (place: Partial<Address> & { coordinates: NonNullable<Address["coordinates"]> }) => void;
