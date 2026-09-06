import { ProdottiRepository } from '@/server/repositories/prodotti.repository';
import { prodottoSchema, ProdottoInput } from '@/lib/validations/prodotti';

export class ProdottiService {
  static async listProdotti(hubId: string) {
    return await ProdottiRepository.getByHubId(hubId);
  }

  static async createProdotto(input: ProdottoInput) {
    // Rimuoviamo temporaneamente l'immagine stringa se presente per validare il resto, 
    // oppure gestiamo l'URL finale. Qui validiamo i dati base del form.
    const { immagine, ...rest } = input;
    const validated = prodottoSchema.parse({ ...rest, immagine: null });
    return await ProdottiRepository.create({ ...validated, immagine: immagine || null });
  }

  static async updateProdotto(id: number, input: Partial<ProdottoInput>) {
    const cleanedInput = Object.fromEntries(
      Object.entries(input).filter(([_, v]) => v !== undefined)
    );
    return await ProdottiRepository.update(id, cleanedInput);
  }

  static async updateImmagineProdotto(id: number, url: string) {
    return await ProdottiRepository.updateImmagine(id, url);
  }

  static async deleteProdotto(id: number) {
    return await ProdottiRepository.softDelete(id);
  }
}