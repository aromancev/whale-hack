import {Pet} from "./pets.js"

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
    ],
    curly_hairless_cat: [
        'cornish_rex',
        'devon_rex',
        'laperm',
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
    ],
    tail_different_cat: [
        'japanese_bobtail',
        'kurilian_bobtail',
        'manx',
        'cymric',
    ],
    classic_house_cat: [
        'european_shorthair',
        'american_shorthair',
        'domestic_shorthair',
        'domestic_longhair',
    ],
} as const

export type CatBreedGroup = keyof typeof CAT_BREEDS_BY_GROUP

export type CatBreed = {
    [Group in CatBreedGroup]: (typeof CAT_BREEDS_BY_GROUP)[Group][number]
}[CatBreedGroup]

export type CatBreedForGroup<Group extends CatBreedGroup> =
    (typeof CAT_BREEDS_BY_GROUP)[Group][number]

export const CAT_BREED_TO_GROUP = {
    persian: 'flat_face_fluffy',
    himalayan: 'flat_face_fluffy',
    exotic_shorthair: 'flat_face_fluffy',
    maine_coon: 'big_forest_cat',
    norwegian_forest_cat: 'big_forest_cat',
    siberian: 'big_forest_cat',
    ragdoll: 'blue_eyes_point_fluffy',
    birman: 'blue_eyes_point_fluffy',
    balinese: 'blue_eyes_point_fluffy',
    british_shorthair: 'round_teddy_cat',
    british_longhair: 'round_teddy_cat',
    scottish_fold: 'round_teddy_cat',
    scottish_straight: 'round_teddy_cat',
    chartreux: 'round_teddy_cat',
    siamese: 'slim_big_ears',
    oriental_shorthair: 'slim_big_ears',
    oriental_longhair: 'slim_big_ears',
    peterbald: 'slim_big_ears',
    bengal: 'leopard_cat',
    ocicat: 'leopard_cat',
    egyptian_mau: 'leopard_cat',
    savannah: 'leopard_cat',
    toyger: 'leopard_cat',
    cornish_rex: 'curly_hairless_cat',
    devon_rex: 'curly_hairless_cat',
    laperm: 'curly_hairless_cat',
    sphynx: 'curly_hairless_cat',
    donskoy: 'curly_hairless_cat',
    abyssinian: 'athletic_fine_cat',
    somali: 'athletic_fine_cat',
    turkish_angora: 'athletic_fine_cat',
    burmese: 'compact_sleek_cat',
    bombay: 'compact_sleek_cat',
    tonkinese: 'compact_sleek_cat',
    havana_brown: 'compact_sleek_cat',
    singapura: 'compact_sleek_cat',
    japanese_bobtail: 'tail_different_cat',
    kurilian_bobtail: 'tail_different_cat',
    manx: 'tail_different_cat',
    cymric: 'tail_different_cat',
    european_shorthair: 'classic_house_cat',
    american_shorthair: 'classic_house_cat',
    domestic_shorthair: 'classic_house_cat',
    domestic_longhair: 'classic_house_cat',
} as const satisfies Record<CatBreed, CatBreedGroup>

export type Cat<Group extends CatBreedGroup = CatBreedGroup> = Pet & {
    breed_group: Group,
    breed: CatBreedForGroup<Group>,
}
