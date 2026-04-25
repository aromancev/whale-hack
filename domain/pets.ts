export type Color = '' | '';
export type Size = 'small' | 'medium' | 'large';

export type Pet = {
    species: 'cat',
    breed: string,
    breed_group: string,
    gender: 'male' | 'female',
    age_years?: number,
    age_group?: 'yong' | 'adult' | 'senior',
    name?: string,
    appearance?: string,
    description?: string,
    health_info?: string,
    behavior?: string,
    unique_details?: string,
    chipped?: boolean,
    chip_number?: string,
    color?: Color,
    collar?: boolean,
    size?: Size,
}
