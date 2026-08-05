export type PianoTrack = {
  id: string;
  title: string;
  composer: string;
  youtubeId: string;
};

export const PIANO: PianoTrack[] = [
  { id: "01", title: "The Gambler", composer: "Hiromi", youtubeId: "bbVHVRnYNCc" },
  { id: "02", title: "Harry Potter Medley", composer: "John Williams", youtubeId: "YyEYwovCLXQ" },
  { id: "03", title: "La Valse", composer: "Ravel", youtubeId: "yFAoNvYfLFc" },
  { id: "04", title: "En blanc et noir, I", composer: "Debussy", youtubeId: "hLuJJEzfAmU" },
  { id: "05", title: "Souvenirs", composer: "Barber", youtubeId: "spG0MDRDHnY" },
  { id: "06", title: "Prelude & Fugue No. 24 in B minor", composer: "Bach", youtubeId: "o0TaftOh0RE" },
  { id: "07", title: "Piano Sonata Op. 10 No. 2, II", composer: "Beethoven", youtubeId: "zGDqk6S47Nw" },
  { id: "08", title: "Waldesrauschen", composer: "Liszt", youtubeId: "CdODEdTNAa0" },
];

export type FoodPhoto = {
  src: string;
  alt: string;
};

export const FOOD_PHOTOS: FoodPhoto[] = [
  { src: "/images/food-places/IMG_1478.jpg", alt: "Gringotts dragon at Universal Studios" },
  { src: "/images/food-places/IMG_20240814_104404.jpg", alt: "Avocado toast with fried egg" },
  { src: "/images/food-places/IMG_3281.jpg", alt: "Japanese sake bar" },
  { src: "/images/food-places/IMG_20241016_135106.jpg", alt: "Moulin Rouge musical" },
  { src: "/images/food-places/IMG_3589.jpg", alt: "Bustling food hall" },
  { src: "/images/food-places/IMG_20240814_104406.jpg", alt: "Strawberry pancakes" },
  { src: "/images/food-places/IMG_4169.jpg", alt: "Toronto at night" },
  { src: "/images/food-places/IMG_20240822_122617.jpg", alt: "Upscale restaurant interior" },
  { src: "/images/food-places/IMG_20241013_200718.jpg", alt: "Cucumber and fish slices" },
];
