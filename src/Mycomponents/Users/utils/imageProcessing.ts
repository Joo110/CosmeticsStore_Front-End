// src/utils/imageProcessing.ts
export async function centerCropAndResizeFile(file: File, size = 800, outputType = 'image/jpeg', quality = 0.85): Promise<File> {
  return new Promise<File>((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        // natural dimensions
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;

        // compute square crop (center)
        const side = Math.min(iw, ih);
        const sx = Math.floor((iw - side) / 2);
        const sy = Math.floor((ih - side) / 2);
        const sw = side;
        const sh = side;

        // target canvas
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (!ctx) throw new Error('Cannot get canvas 2d context');

        // draw cropped image scaled to target size
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);

        // convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Failed to create blob'));
            // create File so existing upload logic works
            const outName = file.name.replace(/\.[^/.]+$/, '') + `_${size}.jpg`;
            const newFile = new File([blob], outName, { type: outputType });
            resolve(newFile);
          },
          outputType,
          quality
        );
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error('Image load error'));
    // read file as data URL
    const fr = new FileReader();
    fr.onload = () => {
      img.src = String(fr.result);
    };
    fr.onerror = () => reject(new Error('FileReader error'));
    fr.readAsDataURL(file);
  });
}