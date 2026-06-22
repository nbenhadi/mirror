export type Screen = { id: 'home' } | { id: 'generic'; toolId: string; action?: string }

export type Navigate = (screen: Screen) => void
