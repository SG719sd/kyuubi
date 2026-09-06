import { createClient } from '@/utils/supabase/server';

export interface ProdottoGiacenza {
  id: number;
  quantita_nuovo: number;
  titolo: string;
  prezzo_listino: number;
}

export async function getGiacenzaProdotto(
  idHub: string,
  idProdotto: number
): Promise<ProdottoGiacenza | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('prodotti')
    .select('id, quantita_nuovo, titolo, prezzo_listino')
    .eq('id_hub', idHub)
    .eq('id', idProdotto)
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw new Error(`Errore recupero giacenza prodotto: ${error.message}`);
  return data as ProdottoGiacenza | null;
}

export async function updateGiacenzaProdotto(
  idHub: string,
  idProdotto: number,
  nuovaQuantita: number
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('prodotti')
    .update({
      quantita_nuovo: nuovaQuantita,
      updated_at: new Date().toISOString(),
    })
    .eq('id_hub', idHub)
    .eq('id', idProdotto);

  if (error) throw new Error(`Errore aggiornamento giacenza: ${error.message}`);
}