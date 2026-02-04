import { create } from 'zustand'
import { getDocumentByCollection } from '@/lib/server/qmd'

export interface SelectedFile {
	path: string
	collectionName: string
	title: string
	content: string
	lineNumber?: number
}

interface FileViewerState {
	selectedFile: SelectedFile | null
	isLoading: boolean

	// Actions
	openFromSearch: (result: {
		filepath: string
		title: string | null
		content: string
	}) => Promise<void>
	openFromCollection: (path: string, collectionName: string) => Promise<void>
	close: () => void
}

export const useFileViewerStore = create<FileViewerState>()((set) => ({
	selectedFile: null,
	isLoading: false,

	openFromSearch: async (result) => {
		set({ isLoading: true })
		try {
			// Parse qmd://collection/path format
			const match = result.filepath.match(/^qmd:\/\/([^/]+)\/(.+)$/)
			if (!match) throw new Error('Invalid filepath')

			const collectionName = match[1]!
			let path = match[2]!
			let lineNumber: number | undefined

			// Extract line number
			const lineMatch = path.match(/:(\d+)$/)
			if (lineMatch && lineMatch[1]) {
				lineNumber = parseInt(lineMatch[1], 10)
				path = path.replace(/:\d+$/, '')
			}

			const data = await getDocumentByCollection({
				data: { collectionName, path },
			})

			set({
				selectedFile: {
					path,
					collectionName,
					title: data.title || path.split('/').pop() || path,
					content: data.content,
					lineNumber,
				},
				isLoading: false,
			})
		} catch (err) {
			set({ isLoading: false })
			throw err
		}
	},

	openFromCollection: async (path, collectionName) => {
		set({ isLoading: true })
		try {
			const data = await getDocumentByCollection({
				data: { collectionName, path },
			})

			set({
				selectedFile: {
					path,
					collectionName,
					title: data.title || path.split('/').pop() || path,
					content: data.content,
				},
				isLoading: false,
			})
		} catch (err) {
			set({ isLoading: false })
			throw err
		}
	},

	close: () => set({ selectedFile: null }),
}))
