import { z } from "zod";
import { PetSchema } from "./pets";

export const CAT_BREEDS_BY_GROUP = {
    flat_face_fluffy: [
        'persian',
        'himalayan',
        'exotic_shorthair',
    ],

    big_forest_cat: [
        'maine_coon',
        'norwegian_forest_cat',
        'siberian',
    ],

    blue_eyes_point_fluffy: [
        'ragdoll',
        'birman',
        'balinese',
    ],

    round_teddy_cat: [
        'british_shorthair',
        'british_longhair',
        'scottish_fold',
        'scottish_straight',
        'chartreux',
    ],

    slim_big_ears: [
        'siamese',
        'thai',
        'oriental_shorthair',
        'oriental_longhair',
        'peterbald',
    ],

    leopard_cat: [
        'bengal',
        'ocicat',
        'egyptian_mau',
        'savannah',
        'toyger',
        'chausie',
    ],

    curly_hairless_cat: [
        'cornish_rex',
        'devon_rex',
        'laperm',
        'selkirk_rex',
        'sphynx',
        'donskoy',
    ],

    athletic_fine_cat: [
        'abyssinian',
        'somali',
        'turkish_angora',
    ],

    compact_sleek_cat: [
        'burmese',
        'bombay',
        'tonkinese',
        'havana_brown',
        'singapura',
        'korat',
        'russian_blue',
        'burmilla',
    ],

    tail_different_cat: [
        'japanese_bobtail',
        'kurilian_bobtail',
        'manx',
        'cymric',
        'american_bobtail',
    ],

    turkish_van: [
        'turkish_van',
    ],

    nebelung: [
        'nebelung',
    ],

    pixie_bob: [
        'pixie_bob',
    ],

    lykoi: [
        'lykoi',
    ],

    york_chocolate: [
        'york_chocolate',
    ],
    domestic_cat: [
        'domestic_cat',
    ],
} as const

export type CatBreedGroup = keyof typeof CAT_BREEDS_BY_GROUP

export type CatBreed = {
    [Group in CatBreedGroup]: (typeof CAT_BREEDS_BY_GROUP)[Group][number]
}[CatBreedGroup]

export type CatBreedForGroup<Group extends CatBreedGroup> =
    (typeof CAT_BREEDS_BY_GROUP)[Group][number]

type CatBreedToGroup = {
    [Group in CatBreedGroup as CatBreedForGroup<Group>]: Group
}

export const CAT_BREED_TO_GROUP = Object.fromEntries(
    Object.entries(CAT_BREEDS_BY_GROUP).flatMap(([group, breeds]) =>
        breeds.map((breed) => [breed, group])
    ),
) as CatBreedToGroup

const catBreedGroups = Object.keys(CAT_BREEDS_BY_GROUP) as [CatBreedGroup, ...CatBreedGroup[]];
const catBreeds = Object.values(CAT_BREEDS_BY_GROUP).flat() as [CatBreed, ...CatBreed[]];
const catColors = [
    "black",
    "white",
    "gray",
    "orange",
    "brown",
    "cream",
    "black_and_white",
    "gray_and_white",
    "orange_and_white",
    "brown_and_white",
    "brown_tabby",
    "gray_tabby",
    "orange_tabby",
    "tabby_and_white",
    "brown_spotted",
    "gray_spotted",
    "calico",
    "tortoiseshell",
] as const;

export const CatBreedGroupSchema = z.enum(catBreedGroups);
export const CatBreedSchema = z.enum(catBreeds);
export const CatColorSchema = z.enum(catColors);

export const CatSchema = PetSchema.extend({
    breed_group: CatBreedGroupSchema,
    breed: CatBreedSchema,
    color: CatColorSchema.optional(),
});

export type Cat = z.infer<typeof CatSchema>;
export type CatColor = z.infer<typeof CatColorSchema>;
