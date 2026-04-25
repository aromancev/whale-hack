import { ISODateTimeString } from "@/platform/time"
import { Pet } from "./pets"


export type Case = {
    pet: Pet,
    lost_time: ISODateTimeString,
    lost_place: Address, 
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
