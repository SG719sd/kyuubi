import { ProfessionistiRepository } from '@/server/repositories/professionisti.repository';
import { professionistaSchema, ProfessionistaInput } from '@/lib/validations/professionisti';

export class ProfessionistiService {
  static async listProfessionisti(hubId: string) {
    return await ProfessionistiRepository.getByHubId(hubId);
  }

  static async createProfessionista(input: ProfessionistaInput) {
    const validated = professionistaSchema.parse(input);
    return await ProfessionistiRepository.create(validated);
  }

  static async updateProfessionista(id: number, input: Partial<ProfessionistaInput>) {
    const cleanedInput = Object.fromEntries(
      Object.entries(input).filter(([_, v]) => v !== undefined)
    );
    return await ProfessionistiRepository.update(id, cleanedInput);
  }

    static async updateImmagineProfessionista(id: number, url: string) {
      return await ProfessionistiRepository.updateImmagine(id, url);
    }
  static async deleteProfessionista(id: number) {
    return await ProfessionistiRepository.softDelete(id);
  }
}