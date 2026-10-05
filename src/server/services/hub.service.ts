import { HubRepository } from "../repositories/hub.repository";
import { HubRow, TablesInsert } from "@/types";
import { cache } from "react";

export class HubService {
  static checkSlugAvailability = cache(async (slug: string): Promise<boolean> => {
    const cleanSlug = slug.toLowerCase().trim();
    const existing = await HubRepository.findBySlug(cleanSlug);
    return !existing;
  });

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

  // --- METODO PER RECUPERARE GLI HUBS (con memoizzazione per richiesta) ---
  static getUserHubs = cache(async (userId: string): Promise<HubRow[]> => {
    return await HubRepository.findUserHubs(userId);
  });

  // --- METODO RECUPERO HUB CON PROFESSIONISTA (con memoizzazione per richiesta) ---
  static getHubWithProfessionista = cache(async (slug: string, userId: string) => {
    return await HubRepository.findBySlugWithProfessionista(slug, userId);
  });
}
