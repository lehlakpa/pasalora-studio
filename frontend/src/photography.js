const photo=id=>`https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=85`;
export const photography={
 fashion:['photo-1542291026-7eec264c27ff','photo-1556821840-3a63f95609a7','photo-1521572163474-6864f9cf17ab','photo-1588850561407-ed78c282e89b','photo-1553062407-98eeb64c6a62','photo-1549298916-b41d501d3772'],
};
export function templatePhoto(type,index=0){const photos=photography[type]||photography.fashion;return photo(photos[index%photos.length]);}
