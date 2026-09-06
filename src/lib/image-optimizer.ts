/**
 * Ridimensiona e converte un file immagine in formato WebP lato client.
 */
export async function compressAndConvertToWebP(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.82
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let { width, height } = img;

        // Calcolo ridimensionamento proporzionale
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Impossibile creare il contesto canvas per l\'immagine.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Esporta in formato image/webp
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Errore durante la conversione in WebP.'));
            }
          },
          'image/webp',
          quality
        );
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
}


/* 

Come riutilizzare il compressore WebP per Piatti, Prodotti e Servizi:
In futuro, quando caricherai immagini per piatti o prodotti, ti basterà riutilizzare la funzione compressAndConvertToWebP:


import { compressAndConvertToWebP } from '@/lib/image-optimizer';

// Esempio per upload piatto (es. max 1200x1200px)
const webpBlob = await compressAndConvertToWebP(file, 1200, 1200, 0.85);
const filePath = `${hubId}/piatti/${Date.now()}-piatto.webp`;

await supabase.storage
  .from('hubs_media')
  .upload(filePath, webpBlob, { contentType: 'image/webp' });

*/