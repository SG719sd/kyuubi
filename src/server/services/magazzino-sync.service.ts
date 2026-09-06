import {
  getGiacenzaProdotto,
  updateGiacenzaProdotto,
} from '@/server/repositories/magazzino.repository';

export async function scaricaProdotto(
  idHub: string,
  idProdotto: number,
  quantita: number
): Promise<void> {
  const prodotto = await getGiacenzaProdotto(idHub, idProdotto);

  if (!prodotto) {
    throw new Error(`Prodotto con ID ${idProdotto} non trovato in magazzino.`);
  }

  if (prodotto.quantita_nuovo < quantita) {
    throw new Error(
      `Giacenza insufficiente per "${prodotto.titolo}". Disponibili: ${prodotto.quantita_nuovo}, Richiesti: ${quantita}`
    );
  }

  const nuovaGiacenza = prodotto.quantita_nuovo - quantita;
  await updateGiacenzaProdotto(idHub, idProdotto, nuovaGiacenza);
}

export async function ripristinaProdotto(
  idHub: string,
  idProdotto: number,
  quantita: number
): Promise<void> {
  const prodotto = await getGiacenzaProdotto(idHub, idProdotto);

  if (!prodotto) return;

  const nuovaGiacenza = prodotto.quantita_nuovo + quantita;
  await updateGiacenzaProdotto(idHub, idProdotto, nuovaGiacenza);
}