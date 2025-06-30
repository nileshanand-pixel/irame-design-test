export const isImageFile = (file) => {
    return file.type.includes("image");
}

export function isImageUrl(url) {
  return /\.(jpeg|jpg|gif|png|webp|svg|bmp)$/i.test(url);
}