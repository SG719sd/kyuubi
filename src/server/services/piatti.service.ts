import { PiattiRepository } from '@/server/repositories/piatti.repository';
import { piattoSchema, PiattoInput } from '@/lib/validations/piatti';
import { StorageService } from '@/server/services/storage.service';

export class PiattiService {
  static async listPiatti(hubId: string) {
    return await PiattiRepository.getByHubId(hubId);
  }

  static async listPrenotabili(hubId: string) {
    return await PiattiRepository.getPrenotabiliByHubId(hubId);
  }

  static async getPiattoById(id: number) {
    return await PiattiRepository.getById(id);
  }

  static async createPiatto(input: PiattoInput) {
    const { immagine, ...rest } = input;
    const validated = piattoSchema.parse({ ...rest, immagine: null });
    return await PiattiRepository.create({ ...validated, immagine: immagine || null });
  }

  static async updatePiatto(id: number, input: Partial<PiattoInput>) {
    const cleanedInput = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined)
    );
    return await PiattiRepository.update(id, cleanedInput);
  }

  static async updateImmaginePiatto(id: number, url: string | null) {
    const formattedUrl = url && url.trim() ? url.trim() : null;
    const existing = await PiattiRepository.getById(id);
    const updated = await PiattiRepository.updateImmagine(id, formattedUrl);
    if (existing?.immagine && existing.immagine !== formattedUrl) {
      StorageService.cleanupOldMedia(existing.immagine, formattedUrl);
    }
    return updated;
  }

  static async deletePiatto(id: number) {
    const existing = await PiattiRepository.getById(id);
    if (existing?.immagine) {
      StorageService.cleanupOldMedia(existing.immagine);
    }
    return await PiattiRepository.softDelete(id);
  }

}