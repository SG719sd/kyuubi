import { ProdottiRepository } from '@/server/repositories/prodotti.repository';
import { prodottoSchema, ProdottoInput } from '@/lib/validations/prodotti';
import { StorageService } from '@/server/services/storage.service';

export class ProdottiService {
  static async listProdotti(hubId: string) {
    return await ProdottiRepository.getByHubId(hubId);
  }

  static async listPrenotabili(hubId: string) {
    return await ProdottiRepository.getPrenotabiliByHubId(hubId);
  }

  static async getProdottoById(id: number) {
    return await ProdottiRepository.getById(id);
  }

  static async createProdotto(input: ProdottoInput) {
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
    const existing = await ProdottiRepository.getById(id);
    if (existing?.immagine && existing.immagine !== url) {
      await StorageService.deleteFile(existing.immagine);
    }
    return await ProdottiRepository.updateImmagine(id, url);
  }

  static async deleteProdotto(id: number) {
    const existing = await ProdottiRepository.getById(id);
    if (existing?.immagine) {
      await StorageService.deleteFile(existing.immagine);
    }
    return await ProdottiRepository.softDelete(id);
  }
}