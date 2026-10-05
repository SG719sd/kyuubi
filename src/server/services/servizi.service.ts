import { ServiziRepository } from '@/server/repositories/servizi.repository';
import { servizioSchema, ServizioInput } from '@/lib/validations/servizi';
import { StorageService } from '@/server/services/storage.service';

export class ServiziService {
  static async listServizi(hubId: string) {
    return await ServiziRepository.getByHubId(hubId);
  }

  static async listPrenotabili(hubId: string) {
    return await ServiziRepository.getPrenotabiliByHubId(hubId);
  }

  static async getServizioById(id: number) {
    return await ServiziRepository.getById(id);
  }

  static async createServizio(input: ServizioInput) {
    const { immagine, ...rest } = input;
    const validated = servizioSchema.parse({ ...rest, immagine: null });
    return await ServiziRepository.create({ ...validated, immagine: immagine || null });
  }

  static async updateServizio(id: number, input: Partial<ServizioInput>) {
    const cleanedInput = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined)
    );
    return await ServiziRepository.update(id, cleanedInput);
  }

  static async updateImmagineServizio(id: number, url: string | null) {
    const formattedUrl = url && url.trim() ? url.trim() : null;
    const existing = await ServiziRepository.getById(id);
    const updated = await ServiziRepository.updateImmagine(id, formattedUrl);
    if (existing?.immagine && existing.immagine !== formattedUrl) {
      StorageService.cleanupOldMedia(existing.immagine, formattedUrl);
    }
    return updated;
  }

  static async deleteServizio(id: number) {
    const existing = await ServiziRepository.getById(id);
    if (existing?.immagine) {
      StorageService.cleanupOldMedia(existing.immagine);
    }
    return await ServiziRepository.softDelete(id);
  }

}