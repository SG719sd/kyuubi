import { ServiziRepository } from '@/server/repositories/servizi.repository';
import { servizioSchema, ServizioInput } from '@/lib/validations/servizi';

export class ServiziService {
  static async listServizi(hubId: string) {
    return await ServiziRepository.getByHubId(hubId);
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
    return await ServiziRepository.updateImmagine(id, url);
  }

  static async deleteServizio(id: number) {
    return await ServiziRepository.softDelete(id);
  }
}