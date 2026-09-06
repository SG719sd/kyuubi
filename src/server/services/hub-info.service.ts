import { HubInfoRepository } from '../repositories/hub-info.repository';
import { UpdateHubGeneralInput, UpdateHubBillingInput } from '@/lib/validations/hub-info';

export class HubInfoService {
  static async getHubFullInfo(slug: string) {
    const data = await HubInfoRepository.getHubDataBySlug(slug);
    if (!data) throw new Error('Hub non trovato');
    return data;
  }

  static async updateGeneralInfo(hubId: string, input: UpdateHubGeneralInput) {
    return await HubInfoRepository.updateHub(hubId, input);
  }

  static async updateBillingInfo(hubId: string, input: UpdateHubBillingInput) {
    return await HubInfoRepository.upsertBillingInfo(hubId, input);
  }
}