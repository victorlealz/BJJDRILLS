export function remoteWins(remoteUpdatedAt: string | null | undefined, localUpdatedAt: string) {
  if (!remoteUpdatedAt) return false
  return new Date(remoteUpdatedAt).getTime() >= new Date(localUpdatedAt).getTime()
}
