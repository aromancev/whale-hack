import { ISODateTimeString } from "@/platform/time"
import { Pet } from "./pets"
import { Owner } from "./owner"

export type Sighting = {
    place: Address,
    time: ISODateTimeString,
}

export type Case = {
    owner: Owner,
    pet: Pet,
    lost_time: ISODateTimeString,
    lost_place: Address,
    sightings: Sighting[],
    reward?: string,
}

type Address = {
    country: string,
    city: string,
    region?: string,
    district?: string,
    street?: string,
    house_number?: string,
    apartment?: string,
    postal_code?: string,
    full_address?: string,
    coordinates?: {
        latitude: number,
        longitude: number,
    },
}
