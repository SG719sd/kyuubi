import { OrariRepository } from '@/server/repositories/orari.repository';
import { orarioLavoroSchema, OrarioLavoroInput } from '@/lib/validations/orari';

export class OrariService {
  static async listOrari(hubId: string, idProfessionista?: number | null) {
    return await OrariRepository.getByHubId(hubId, idProfessionista);
  }

  static async createOrario(input: OrarioLavoroInput) {
    const validated = orarioLavoroSchema.parse(input);
    return await OrariRepository.create(validated);
  }

  static async updateOrario(id: number, input: Partial<OrarioLavoroInput>) {
    const cleanedInput = Object.fromEntries(
      Object.entries(input).filter(([_, v]) => v !== undefined)
    );
    return await OrariRepository.update(id, cleanedInput);
  }

  static async deleteOrario(id: number) {
    return await OrariRepository.delete(id);
  }
}