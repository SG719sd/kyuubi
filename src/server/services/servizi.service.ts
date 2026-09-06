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
      Object.entries(input).filter(([_, v]) => v !== undefined)
    );
    return await ServiziRepository.update(id, cleanedInput);
  }

  static async updateImmagineServizio(id: number, url: string) {
    // Se c'è già una vecchia immagine diversa, la puliamo
    const existing = await ServiziRepository.getById(id);
    if (existing?.immagine && existing.immagine !== url) {
      await StorageService.deleteFile(existing.immagine);
    }
    return await ServiziRepository.updateImmagine(id, url);
  }

  static async deleteServizio(id: number) {
    const existing = await ServiziRepository.getById(id);
    if (existing?.immagine) {
      await StorageService.deleteFile(existing.immagine);
    }
    return await ServiziRepository.softDelete(id);
  }
}