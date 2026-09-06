// Helper per generare i percorsi coerenti nel bucket hubs_media
export const getHubStoragePath = {
  logo: (hubId: string, filename: string) => `${hubId}/logo/${filename}`,
  piatto: (hubId: string, filename: string) => `${hubId}/piatti/${filename}`,
  prodotto: (hubId: string, filename: string) => `${hubId}/prodotti/${filename}`,
  servizio: (hubId: string, filename: string) => `${hubId}/servizi/${filename}`,
  professionista: (hubId: string, filename: string) => `${hubId}/professionisti/${filename}`,
};