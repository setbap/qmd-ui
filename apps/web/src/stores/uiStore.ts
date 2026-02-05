import { create } from 'zustand'

export type CollectionDialogType =
  | 'rename'
  | 'delete'
  | 'info'
  | 'addContext'
  | null

interface DialogState {
  type: CollectionDialogType
  collectionName: string | null
}

interface UIState {
  // Global overlays
  isCommandPaletteOpen: boolean
  isCreateDialogOpen: boolean
  isSettingsOpen: boolean
  isSearchHistoryOpen: boolean

  // Collection dialog state (single source)
  collectionDialog: DialogState

  // Actions
  openCommandPalette: () => void
  closeCommandPalette: () => void
  openCreateDialog: () => void
  closeCreateDialog: () => void
  openSettings: () => void
  closeSettings: () => void
  openSearchHistory: () => void
  closeSearchHistory: () => void

  openRenameDialog: (collectionName: string) => void
  openDeleteDialog: (collectionName: string) => void
  openInfoDialog: (collectionName: string) => void
  openAddContextDialog: (collectionName: string) => void
  closeCollectionDialog: () => void
}

export const useUIStore = create<UIState>()((set) => ({
  isCommandPaletteOpen: false,
  isCreateDialogOpen: false,
  isSettingsOpen: false,
  isSearchHistoryOpen: false,
  collectionDialog: { type: null, collectionName: null },

  openCommandPalette: () => set({ isCommandPaletteOpen: true }),
  closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
  openCreateDialog: () => set({ isCreateDialogOpen: true }),
  closeCreateDialog: () => set({ isCreateDialogOpen: false }),
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
  openSearchHistory: () => set({ isSearchHistoryOpen: true }),
  closeSearchHistory: () => set({ isSearchHistoryOpen: false }),

  openRenameDialog: (name) =>
    set({
      collectionDialog: { type: 'rename', collectionName: name },
    }),
  openDeleteDialog: (name) =>
    set({
      collectionDialog: { type: 'delete', collectionName: name },
    }),
  openInfoDialog: (name) =>
    set({
      collectionDialog: { type: 'info', collectionName: name },
    }),
  openAddContextDialog: (name) =>
    set({
      collectionDialog: { type: 'addContext', collectionName: name },
    }),
  closeCollectionDialog: () =>
    set({
      collectionDialog: { type: null, collectionName: null },
    }),
}))
