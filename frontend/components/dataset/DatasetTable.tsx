'use client'

import React, { useState } from 'react'
import { Plus, Edit2, Trash2, Check, X, Search, Loader2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DatasetRow } from '@/lib/types'
import api from '@/lib/api'
import { toast } from 'sonner'

interface DatasetTableProps {
  projectId: string
  initialRows: DatasetRow[]
  onRowsChange: () => void
}

export default function DatasetTable({ projectId, initialRows, onRowsChange }: DatasetTableProps) {
  const [rows, setRows] = useState<DatasetRow[]>(initialRows)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<DatasetRow>>({})
  const [addingRow, setAddingRow] = useState(false)
  const [newRowForm, setNewRowForm] = useState({
    instruction: '',
    input: '',
    output: '',
  })
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Filter rows
  const filteredRows = initialRows.filter(
    (row) =>
      row.instruction.toLowerCase().includes(search.toLowerCase()) ||
      (row.input || '').toLowerCase().includes(search.toLowerCase()) ||
      row.output.toLowerCase().includes(search.toLowerCase())
  )

  const startEdit = (row: DatasetRow) => {
    setEditingId(row.id)
    setEditForm({ ...row })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const saveEdit = async (rowId: string) => {
    setActionLoading(rowId)
    try {
      await api.dataset.updateRow(projectId, rowId, editForm)
      toast.success('Row updated successfully')
      setEditingId(null)
      setEditForm({})
      onRowsChange()
    } catch (err) {
      console.error(err)
      toast.error('Failed to update row')
    } finally {
      setActionLoading(null)
    }
  }

  const deleteRow = async (rowId: string) => {
    if (!confirm('Are you sure you want to delete this row?')) return
    setActionLoading(rowId)
    try {
      await api.dataset.deleteRow(projectId, rowId)
      toast.success('Row deleted')
      onRowsChange()
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete row')
    } finally {
      setActionLoading(null)
    }
  }

  const handleAddRow = async () => {
    if (!newRowForm.instruction || !newRowForm.output) {
      toast.error('Instruction and Output are required')
      return
    }
    setActionLoading('add')
    try {
      await api.dataset.addRow(projectId, {
        instruction: newRowForm.instruction,
        input: newRowForm.input,
        output: newRowForm.output,
        rowIndex: initialRows.length,
      })
      toast.success('Row added successfully')
      setNewRowForm({ instruction: '', input: '', output: '' })
      setAddingRow(false)
      onRowsChange()
    } catch (err) {
      console.error(err)
      toast.error('Failed to add row')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search rows..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-900/40 border-slate-800 text-slate-200 placeholder-slate-500"
          />
        </div>

        <Button
          onClick={() => setAddingRow(!addingRow)}
          className="bg-purple-600 hover:bg-purple-700 text-white gap-2 flex items-center shadow-lg shadow-purple-500/20 w-full sm:w-auto justify-center"
        >
          <Plus className="h-4 w-4" />
          {addingRow ? 'Cancel Add' : 'Add Row Manually'}
        </Button>
      </div>

      {addingRow && (
        <div className="p-4 border border-purple-500/20 bg-purple-950/10 rounded-xl space-y-4 glassmorphism">
          <h3 className="text-sm font-semibold text-purple-400">Add New Training Example</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Instruction *</label>
              <Textarea
                placeholder="What the model should be asked..."
                value={newRowForm.instruction}
                onChange={(e) => setNewRowForm({ ...newRowForm, instruction: e.target.value })}
                className="bg-slate-950/60 border-slate-800 text-slate-200 text-sm min-h-[80px]"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Input Context (Optional)</label>
              <Textarea
                placeholder="Additional helper context..."
                value={newRowForm.input}
                onChange={(e) => setNewRowForm({ ...newRowForm, input: e.target.value })}
                className="bg-slate-950/60 border-slate-800 text-slate-200 text-sm min-h-[80px]"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Expected Output *</label>
              <Textarea
                placeholder="The perfect response..."
                value={newRowForm.output}
                onChange={(e) => setNewRowForm({ ...newRowForm, output: e.target.value })}
                className="bg-slate-950/60 border-slate-800 text-slate-200 text-sm min-h-[80px]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddingRow(false)}
              className="border-slate-800 text-slate-400 hover:bg-slate-950"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddRow}
              disabled={actionLoading === 'add'}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium"
            >
              {actionLoading === 'add' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Example'}
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-800/80 bg-[#12121a]/60 backdrop-blur-md overflow-hidden glassmorphism">
        <Table>
          <TableHeader className="bg-slate-950/50 border-b border-slate-800">
            <TableRow className="border-b border-slate-800">
              <TableHead className="w-[50px] text-slate-400">#</TableHead>
              <TableHead className="w-[30%] text-slate-400">Instruction</TableHead>
              <TableHead className="w-[25%] text-slate-400">Input Context</TableHead>
              <TableHead className="w-[35%] text-slate-400">Expected Output</TableHead>
              <TableHead className="w-[100px] text-right text-slate-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  No dataset examples found. Upload a file or add rows manually.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row, idx) => {
                const isEditing = editingId === row.id
                return (
                  <TableRow key={row.id} className="border-b border-slate-800/60 hover:bg-slate-900/10">
                    <TableCell className="text-slate-500 font-mono text-xs">{row.rowIndex + 1}</TableCell>
                    <TableCell className="align-top">
                      {isEditing ? (
                        <Textarea
                          value={editForm.instruction || ''}
                          onChange={(e) => setEditForm({ ...editForm, instruction: e.target.value })}
                          className="bg-slate-950/80 border-slate-800 text-slate-200 text-xs min-h-[60px]"
                        />
                      ) : (
                        <div className="text-xs text-slate-300 whitespace-pre-wrap max-h-[120px] overflow-y-auto">
                          {row.instruction}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      {isEditing ? (
                        <Textarea
                          value={editForm.input || ''}
                          onChange={(e) => setEditForm({ ...editForm, input: e.target.value })}
                          className="bg-slate-950/80 border-slate-800 text-slate-200 text-xs min-h-[60px]"
                        />
                      ) : (
                        <div className="text-xs text-slate-400 whitespace-pre-wrap max-h-[120px] overflow-y-auto">
                          {row.input || <span className="italic text-slate-600">None</span>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      {isEditing ? (
                        <Textarea
                          value={editForm.output || ''}
                          onChange={(e) => setEditForm({ ...editForm, output: e.target.value })}
                          className="bg-slate-950/80 border-slate-800 text-slate-200 text-xs min-h-[60px]"
                        />
                      ) : (
                        <div className="text-xs text-slate-300 whitespace-pre-wrap max-h-[120px] overflow-y-auto">
                          {row.output}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right align-top">
                      {actionLoading === row.id ? (
                        <div className="flex justify-end p-2">
                          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                        </div>
                      ) : isEditing ? (
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => saveEdit(row.id)}
                            className="h-7 w-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={cancelEdit}
                            className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => startEdit(row)}
                            className="h-7 w-7 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteRow(row.id)}
                            className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-red-950/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
