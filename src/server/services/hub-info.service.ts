import { HubInfoRepository } from '../repositories/hub-info.repository';
import {
  UpdateHubGeneralInput,
  UpdateHubBillingInput,
  UpdateHubStyleSettingsInput,
  updateHubStyleSettingsSchema,
  updateHubGeneralSchema,
  updateHubBillingSchema,
} from '@/lib/validations/hub-info';

export class HubInfoService {
  static async getHubFullInfo(slug: string) {
    const data = await HubInfoRepository.getHubDataBySlug(slug);
    if (!data) throw new Error('Hub non trovato');
    return data;
  }

  static async updateGeneralInfo(hubId: string, input: UpdateHubGeneralInput) {
    const validated = updateHubGeneralSchema.parse(input);
    return await HubInfoRepository.updateHub(hubId, validated);
  }

  static async updateBillingInfo(hubId: string, input: UpdateHubBillingInput) {
    const validated = updateHubBillingSchema.parse(input);
    return await HubInfoRepository.upsertBillingInfo(hubId, validated);
  }

  static async updateStyleSettings(hubId: string, input: UpdateHubStyleSettingsInput) {
    const validated = updateHubStyleSettingsSchema.parse(input);
    const styleVal = validated.style || validated.type || 'default';
    return await HubInfoRepository.updateHub(hubId, {
      has_products: validated.has_products,
      has_dishes: validated.has_dishes,
      has_services: validated.has_services,
      has_booking: validated.has_booking,
      style: styleVal,
      type: styleVal,
      palette: validated.palette,
    });
  }

  static async updateLogo(hubId: string, logoUrl: string | null) {
    return await HubInfoRepository.updateHub(hubId, { logo_url: logoUrl });
  }
}