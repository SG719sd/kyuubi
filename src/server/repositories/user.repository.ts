import { createClient } from "@/utils/supabase/server";
import { UserRow, TablesInsert, TablesUpdate } from "@/types";

export class UserRepository {
  /**
   * Cerca un utente per ID escludendo quelli eliminati (Soft Delete)
   */
  static async findById(id: string): Promise<UserRow | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error) return null;
    return data as UserRow;
  }

  /**
   * Crea un nuovo profilo utente
   */
  static async create(userData: TablesInsert<"users">): Promise<UserRow> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("users")
      .insert(userData as any)
      .select()
      .single();

    if (error) {
      throw new Error(`Errore creazione utente: ${error.message}`);
    }

    return data as UserRow;
  }

  /**
   * Aggiorna i dati dell'utente
   */
  static async update(
    id: string,
    userData: TablesUpdate<"users">,
  ): Promise<UserRow> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("users")
      .update({
        ...userData,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", id)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) {
      throw new Error(`Errore aggiornamento utente: ${error.message}`);
    }

    return data as UserRow;
  }

  static async upsert(userData: TablesInsert<"users">): Promise<UserRow> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("users")
      .upsert(userData as any, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      throw new Error(`Errore salvataggio utente: ${error.message}`);
    }

    return data as UserRow;
  }
  /**
   * Soft Delete: Imposta is_active a false e registra la data in deleted_at
   */
  static async softDelete(id: string): Promise<UserRow> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("users")
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Errore eliminazione utente: ${error.message}`);
    }

    return data as UserRow;
  }
}
