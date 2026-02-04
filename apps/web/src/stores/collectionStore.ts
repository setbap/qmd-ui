import { create } from 'zustand'

interface FileInfo {
	path: string
	title?: string
}

interface CollectionsState {
	// UI State
	expandedCollections: Set<string>
	selectedCollection: string | null

	// File cache (for expanded collections)
	collectionFiles: Record<string, FileInfo[]>
	filesLoading: Record<string, boolean>

	// Actions
	toggleExpand: (name: string) => void
	expand: (name: string) => void
	collapse: (name: string) => void
	selectCollection: (name: string | null) => void
	setCollectionFiles: (name: string, files: FileInfo[]) => void
	setFilesLoading: (name: string, loading: boolean) => void
	clearFileCache: (name?: string) => void
}

export const useCollectionsStore = create<CollectionsState>()((set) => ({
	expandedCollections: new Set(),
	selectedCollection: null,
	collectionFiles: {},
	filesLoading: {},

	toggleExpand: (name) => {
		set((state) => {
			const next = new Set(state.expandedCollections)
			if (next.has(name)) {
				next.delete(name)
			} else {
				next.add(name)
			}
			return { expandedCollections: next }
		})
	},

	expand: (name) => {
		set((state) => {
			const next = new Set(state.expandedCollections)
			next.add(name)
			return { expandedCollections: next }
		})
	},

	collapse: (name) => {
		set((state) => {
			const next = new Set(state.expandedCollections)
			next.delete(name)
			return { expandedCollections: next }
		})
	},

	selectCollection: (name) => set({ selectedCollection: name }),

	setCollectionFiles: (name, files) => {
		set((state) => ({
			collectionFiles: { ...state.collectionFiles, [name]: files },
		}))
	},

	setFilesLoading: (name, loading) => {
		set((state) => ({
			filesLoading: { ...state.filesLoading, [name]: loading },
		}))
	},

	clearFileCache: (name) => {
		if (name) {
			set((state) => {
				const { [name]: _, ...rest } = state.collectionFiles
				const { [name]: __, ...restLoading } = state.filesLoading
				return {
					collectionFiles: rest,
					filesLoading: restLoading,
				}
			})
		} else {
			set({ collectionFiles: {}, filesLoading: {} })
		}
	},
}))
