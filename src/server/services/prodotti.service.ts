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
      Object.entries(input).filter(([, v]) => v !== undefined)
    );
    return await ProdottiRepository.update(id, cleanedInput);
  }

  static async updateImmagineProdotto(id: number, url: string | null) {
    const formattedUrl = url && url.trim() ? url.trim() : null;
    const existing = await ProdottiRepository.getById(id);
    const updated = await ProdottiRepository.updateImmagine(id, formattedUrl);
    if (existing?.immagine && existing.immagine !== formattedUrl) {
      StorageService.cleanupOldMedia(existing.immagine, formattedUrl);
    }
    return updated;
  }

  static async deleteProdotto(id: number) {
    const existing = await ProdottiRepository.getById(id);
    if (existing?.immagine) {
      StorageService.cleanupOldMedia(existing.immagine);
    }
    return await ProdottiRepository.softDelete(id);
  }

}