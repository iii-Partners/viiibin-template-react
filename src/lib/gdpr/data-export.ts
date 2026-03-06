/**
 * GDPR data portability and account deletion stubs.
 * These call API endpoints that should be implemented on the backend.
 */

/**
 * Request an export of all user data (GDPR Article 20 — right to data portability).
 * The backend should compile all user data and send it via email or provide a download link.
 *
 * TODO: Implement backend endpoint POST /api/gdpr/export
 */
export async function requestDataExport(): Promise<{ requestId: string }> {
  // TODO: Replace with actual API call
  // const response = await api.post<{ requestId: string }>('/gdpr/export', {})
  // return response
  console.log('[gdpr] requestDataExport stub')
  return { requestId: `export_${Date.now()}` }
}

/**
 * Request deletion of the user's account and all associated data
 * (GDPR Article 17 — right to erasure).
 *
 * TODO: Implement backend endpoint POST /api/gdpr/delete-account
 */
export async function requestAccountDeletion(): Promise<{ requestId: string }> {
  // TODO: Replace with actual API call
  // const response = await api.post<{ requestId: string }>('/gdpr/delete-account', {})
  // return response
  console.log('[gdpr] requestAccountDeletion stub')
  return { requestId: `deletion_${Date.now()}` }
}
