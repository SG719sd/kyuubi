import { ConsensiRepository } from '../repositories/consensi.repository';

export type InitialConsentsParams = {
  userId: string;
  ipAddress: string;
  marketingAccettato: boolean;
};

export class ConsensiService {
  /**
   * Salva i consensi iniziali raccolti al momento della registrazione
   */
  static async saveInitialConsents({ userId, ipAddress, marketingAccettato }: InitialConsentsParams) {
    const consensiToInsert = [
      {
        id_user: userId,
        tipo_consenso: 'TOS_PIATTAFORMA',
        versione_policy: 'v1.0',
        stato: 'ACCETTATO',
        ip_address: ipAddress,
      },
    ];

    if (marketingAccettato) {
      consensiToInsert.push({
        id_user: userId,
        tipo_consenso: 'MARKETING',
        versione_policy: 'v1.0',
        stato: 'ACCETTATO',
        ip_address: ipAddress,
      });
    }

    return await ConsensiRepository.createMany(consensiToInsert);
  }
}