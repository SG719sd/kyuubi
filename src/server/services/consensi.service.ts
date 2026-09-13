import { ConsensiRepository } from '../repositories/consensi.repository';

export type InitialConsentsParams = {
  userId: string;
  ipAddress: string;
  tosAccettato?: boolean;
  marketingAccettato?: boolean;
};

export class ConsensiService {
  /**
   * Salva i consensi iniziali raccolti al momento della registrazione dell'utente
   * Inserisce 'TOS' (se accettato) e 'MARKETING' (se flaggato)
   */
  static async saveInitialConsents({
    userId,
    ipAddress,
    tosAccettato = true,
    marketingAccettato = false,
  }: InitialConsentsParams) {
    const consensiToInsert = [];

    if (tosAccettato) {
      consensiToInsert.push({
        id_user: userId,
        tipo_consenso: 'TOS',
        versione_policy: 'v1.0',
        stato: 'ACCETTATO',
        ip_address: ipAddress,
      });
    }

    if (marketingAccettato) {
      consensiToInsert.push({
        id_user: userId,
        tipo_consenso: 'MARKETING',
        versione_policy: 'v1.0',
        stato: 'ACCETTATO',
        ip_address: ipAddress,
      });
    }

    if (consensiToInsert.length === 0) return [];

    return await ConsensiRepository.createMany(consensiToInsert);
  }
}
