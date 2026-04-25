import type { Address } from "@/domain/case";
import type { Owner } from "@/domain/owner";
import type { Pet } from "@/domain/pets";

export type FieldErrorKey = "owner.name" | "owner.email" | "pet.name" | "pet.gender" | "lostDate" | "lost_place.city";

export type UpdateOwner = <Key extends keyof Owner>(key: Key, value: Owner[Key]) => void;

export type UpdatePet = <Key extends keyof Pet>(key: Key, value: Pet[Key]) => void;

export type UpdateLostPlace = <Key extends keyof Omit<Address, "coordinates">>(key: Key, value: Address[Key]) => void;
