import { PiattiRepository } from '@/server/repositories/piatti.repository';
import { piattoSchema, PiattoInput } from '@/lib/validations/piatti';

export class PiattiService {
  static async listPiatti(hubId: string) {
    return await PiattiRepository.getByHubId(hubId);
  }

  static async createPiatto(input: PiattoInput) {
    const { immagine, ...rest } = input;
    const validated = piattoSchema.parse({ ...rest, immagine: null });
    return await PiattiRepository.create({ ...validated, immagine: immagine || null });
  }

  static async updatePiatto(id: number, input: Partial<PiattoInput>) {
    const cleanedInput = Object.fromEntries(
      Object.entries(input).filter(([_, v]) => v !== undefined)
    );
    return await PiattiRepository.update(id, cleanedInput);
  }

  static async updateImmaginePiatto(id: number, url: string) {
    return await PiattiRepository.updateImmagine(id, url);
  }

  static async deletePiatto(id: number) {
    return await PiattiRepository.softDelete(id);
  }
}