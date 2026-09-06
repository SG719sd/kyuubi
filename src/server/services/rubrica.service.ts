import { RubricaRepository } from '@/server/repositories/rubrica.repository';
import { rubricaSchema, RubricaInput } from '@/lib/validations/rubrica';

export class RubricaService {
  static async listContatti(hubId: string, search?: string) {
    return await RubricaRepository.getByHubId(hubId, search);
  }

  static async createContatto(input: RubricaInput) {
    const validated = rubricaSchema.parse(input);
    return await RubricaRepository.create(validated);
  }

  static async updateContatto(id: number, input: Partial<RubricaInput>) {
    const cleanedInput = Object.fromEntries(
      Object.entries(input).filter(([_, v]) => v !== undefined)
    );
    return await RubricaRepository.update(id, cleanedInput);
  }

  static async deleteContatto(id: number) {
    return await RubricaRepository.softDelete(id);
  }
}