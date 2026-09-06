import { HubRepository } from "../repositories/hub.repository";
import { HubRow, TablesInsert } from "@/types";

export class HubService {
  static async checkSlugAvailability(slug: string): Promise<boolean> {
    const cleanSlug = slug.toLowerCase().trim();
    const existing = await HubRepository.findBySlug(cleanSlug);
    return !existing;
  }

  static async createHub(data: TablesInsert<'hubs'>): Promise<HubRow> {
    const isAvailable = await this.checkSlugAvailability(data.slug);
    if (!isAvailable) {
      throw new Error(`Lo slug "${data.slug}" è già in uso. Scegli un altro identificativo.`);
    }

    return await HubRepository.create({
      ...data,
      slug: data.slug.toLowerCase().trim(),
    });
  }

  // --- METODO PER RECUPERARE GLI HUBS ---
  static async getUserHubs(userId: string): Promise<HubRow[]> {
    return await HubRepository.findUserHubs(userId);
  }

  // Aggiungi a src/server/services/hub.service.ts

static async getHubWithProfessionista(slug: string, userId: string) {
  return await HubRepository.findBySlugWithProfessionista(slug, userId);
}
}