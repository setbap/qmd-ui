'use client'

import { useState, useCallback } from 'react'
import { RiFolderLine } from '@remixicon/react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUIStore, useCollectionsStore } from '@/stores'
import { toast } from 'sonner'

// Collection type matching what the server returns (from YAML config)
interface Collection {
	name: string
	path: string
	pattern: string
	context?: Record<string, string>
	update?: string
}

interface CollectionDialogsProps {
	collections: Collection[]
	selectedCollection: string | null
	onSelectCollection: (name: string | null) => void
	onDeleteCollection: (name: string) => Promise<void>
	onRenameCollection: (oldName: string, newName: string) => Promise<void>
}

export function CollectionDialogs({
	collections,
	selectedCollection,
	onSelectCollection,
	onDeleteCollection,
	onRenameCollection,
}: CollectionDialogsProps) {
	const { collectionDialog, closeCollectionDialog } = useUIStore()
	const { collectionFiles, clearFileCache } = useCollectionsStore()
	const [newName, setNewName] = useState('')
	const [isRenaming, setIsRenaming] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)

	const collectionToRename =
		collectionDialog.type === 'rename' ? collectionDialog.collectionName : null
	const collectionToDelete =
		collectionDialog.type === 'delete' ? collectionDialog.collectionName : null
	const collectionToInfo =
		collectionDialog.type === 'info'
			? collections.find((c) => c.name === collectionDialog.collectionName)
			: null

	// Handle rename
	const handleConfirmRename = useCallback(async () => {
		if (!collectionToRename || !newName.trim() || newName === collectionToRename) {
			closeCollectionDialog()
			return
		}
		setIsRenaming(true)
		try {
			await onRenameCollection(collectionToRename, newName.trim())
			toast.success(`Collection renamed from "${collectionToRename}" to "${newName}"`)
			// Update selected collection if it was the renamed one
			if (selectedCollection === collectionToRename) {
				onSelectCollection(newName.trim())
			}
			// Clear files from state (they'll be reloaded)
			clearFileCache(collectionToRename)
			closeCollectionDialog()
		} catch (err) {
			toast.error(`Failed to rename collection "${collectionToRename}"`)
		} finally {
			setIsRenaming(false)
			setNewName('')
		}
	}, [
		collectionToRename,
		newName,
		onRenameCollection,
		selectedCollection,
		onSelectCollection,
		closeCollectionDialog,
		clearFileCache,
	])

	// Handle delete
	const handleConfirmDelete = useCallback(async () => {
		if (!collectionToDelete) return
		setIsDeleting(true)
		try {
			await onDeleteCollection(collectionToDelete)
			toast.success(`Collection "${collectionToDelete}" deleted`)
			// Clear files from state
			clearFileCache(collectionToDelete)
			// If the deleted collection was selected, select all
			if (selectedCollection === collectionToDelete) {
				onSelectCollection(null)
			}
			closeCollectionDialog()
		} catch (err) {
			toast.error(`Failed to delete collection "${collectionToDelete}"`)
		} finally {
			setIsDeleting(false)
		}
	}, [
		collectionToDelete,
		onDeleteCollection,
		selectedCollection,
		onSelectCollection,
		closeCollectionDialog,
		clearFileCache,
	])

	// Get file count for a collection
	const getFileCount = useCallback(
		(collectionName: string) => {
			return collectionFiles[collectionName]?.length ?? 0
		},
		[collectionFiles],
	)

	return (
		<>
			{/* Rename Dialog */}
			<Dialog
				open={collectionDialog.type === 'rename'}
				onOpenChange={(open) => {
					if (!open) closeCollectionDialog()
					if (open && collectionToRename) setNewName(collectionToRename)
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="">Rename Collection</DialogTitle>
						<DialogDescription className="">
							Enter a new name for the collection.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="name" className="">
								Collection Name
							</Label>
							<Input
								id="name"
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								placeholder="Enter new name"
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										handleConfirmRename()
									}
								}}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={closeCollectionDialog}
							className="border-amber-900/30 hover:bg-amber-900/30"
						>
							Cancel
						</Button>
						<Button
							onClick={handleConfirmRename}
							disabled={
								isRenaming || !newName.trim() || newName === collectionToRename
							}
						>
							{isRenaming ? 'Renaming...' : 'Rename'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<Dialog
				open={collectionDialog.type === 'delete'}
				onOpenChange={(open) => !open && closeCollectionDialog()}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="text-red-400">Delete Collection</DialogTitle>
						<DialogDescription className="">
							Are you sure you want to delete "{collectionToDelete}"? This action
							cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							onClick={closeCollectionDialog}
							className="border-amber-900/30 hover:bg-amber-900/30"
						>
							Cancel
						</Button>
						<Button
							onClick={handleConfirmDelete}
							disabled={isDeleting}
							className="bg-red-600 hover:bg-red-700"
						>
							{isDeleting ? 'Deleting...' : 'Delete'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Info Dialog */}
			<Dialog
				open={collectionDialog.type === 'info'}
				onOpenChange={(open) => !open && closeCollectionDialog()}
			>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<RiFolderLine className="h-5 w-5" />
							{collectionToInfo?.name}
						</DialogTitle>
						<DialogDescription className="">
							Collection details and configuration
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="space-y-3">
							<div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
								<span className="font-medium">Name:</span>
								<span className="">{collectionToInfo?.name}</span>
							</div>
							<div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
								<span className="font-medium">Path:</span>
								<span className="break-all">{collectionToInfo?.path}</span>
							</div>
							<div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
								<span className="font-medium">Pattern:</span>
								<span className="font-mono">{collectionToInfo?.pattern}</span>
							</div>
							<div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
								<span className="font-medium">Files:</span>
								<span className="">
									{collectionToInfo?.name ? getFileCount(collectionToInfo.name) : 0} files
									indexed
								</span>
							</div>
							{collectionToInfo?.update && (
								<div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
									<span className="font-medium">Auto-update:</span>
									<span className="">{collectionToInfo.update}</span>
								</div>
							)}
							{collectionToInfo?.context &&
								Object.keys(collectionToInfo.context).length > 0 && (
									<div className="space-y-2">
										<span className="font-medium text-sm">Context Paths:</span>
										<div>
											{Object.entries(collectionToInfo.context).map(([path, desc]) => (
												<div key={path} className="text-xs">
													<span className="font-mono">{path}</span>
													<span className=""> - {desc}</span>
												</div>
											))}
											</div>
										</div>
									)}
						</div>
					</div>
					<DialogFooter>
						<Button onClick={closeCollectionDialog}>Close</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
