import { ProfessionistiServiziRepository } from '@/server/repositories/professionisti-servizi.repository';
import { professionistaServizioSchema, ProfessionistaServizioInput } from '@/lib/validations/professionisti-servizi';

export class ProfessionistiServiziService {
  static async listByHub(hubId: string) {
    return await ProfessionistiServiziRepository.getByHubId(hubId);
  }

  static async listByProfessionista(hubId: string, idProfessionista: number) {
    return await ProfessionistiServiziRepository.getByProfId(hubId, idProfessionista);
  }

  static async savePersonalizzazione(input: ProfessionistaServizioInput) {
    const validated = professionistaServizioSchema.parse(input);
    return await ProfessionistiServiziRepository.upsert(validated);
  }

  static async removePersonalizzazione(id: number) {
    return await ProfessionistiServiziRepository.delete(id);
  }
}