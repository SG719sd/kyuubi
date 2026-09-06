import { UserRepository } from "../repositories/user.repository";
import { UserRow, TablesInsert, TablesUpdate } from "@/types";

export class UserService {
  /**
   * Recupera il profilo utente e ne verifica l'attivazione
   */
  static async getUserProfile(userId: string): Promise<UserRow> {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw new Error("Profilo utente non trovato o eliminato.");
    }
    if (!user.is_active) {
      throw new Error("L'account utente è disattivato.");
    }
    return user;
  }

  /**
   * Creazione profilo utente iniziale
   */
  static async createUserProfile(
    userData: TablesInsert<"users">,
  ): Promise<UserRow> {
    return await UserRepository.create(userData);
  }

  /**
   * Aggiorna le informazioni del profilo
   */
  static async updateUserProfile(
    userId: string,
    updateData: TablesUpdate<"users">,
  ): Promise<UserRow> {
    // Verifichiamo prima che l'utente esista e sia attivo
    await this.getUserProfile(userId);

    return await UserRepository.update(userId, updateData);
  }
  static async upsertUserProfile(
    userData: TablesInsert<"users">,
  ): Promise<UserRow> {
    return await UserRepository.upsert(userData);
  }
  /**
   * Esegue la Soft Delete del profilo
   */
  static async deleteUserProfile(userId: string): Promise<UserRow> {
    // Verifichiamo l'esistenza dell'utente
    await this.getUserProfile(userId);

    return await UserRepository.softDelete(userId);
  }

  static async findById(id: string): Promise<UserRow | null> {
    return await UserRepository.findById(id);
  }
}
