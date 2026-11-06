import type { Client, ClientDraft } from '@/types'
import { http } from './http-client'

export const clientsApi = {
  list(): Promise<Client[]> {
    return http.get<Client[]>('/api/clients')
  },

  /** Perfiles de Processing que se pueden asignar a un cliente. */
  profiles(): Promise<string[]> {
    return http.get<string[]>('/api/clients/profiles')
  },

  /** Registrar un cliente. Sin perfil, sus documentos dan "formato no reconocido" hasta que exista el perfil. */
  create(draft: ClientDraft): Promise<Client> {
    return http.post<Client>('/api/clients', draft)
  },

  update(clientId: number, changes: Partial<Omit<ClientDraft, 'code'>> & { active?: boolean }): Promise<Client> {
    return http.patch<Client>(`/api/clients/${clientId}`, changes)
  },
}
