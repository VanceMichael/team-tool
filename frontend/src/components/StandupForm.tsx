import React, { useState, useEffect } from 'react'
import { StandupRecord } from '../types'

interface StandupFormProps {
  initialData?: StandupRecord
  onSubmit: (data: { yesterday: string; today: string; blocker: string }) => void
  onCancel: () => void
  isEditing?: boolean
}

export function StandupForm({ initialData, onSubmit, onCancel, isEditing = false }: StandupFormProps) {
  const [yesterday, setYesterday] = useState('')
  const [today, setToday] = useState('')
  const [blocker, setBlocker] = useState('')

  useEffect(() => {
    if (initialData) {
      setYesterday(initialData.yesterday || '')
      setToday(initialData.today || '')
      setBlocker(initialData.blocker || '')
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ yesterday, today, blocker })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          昨天干了啥
        </label>
        <textarea
          value={yesterday}
          onChange={(e) => setYesterday(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={3}
          placeholder="简要描述昨天完成的工作..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          今天准备干啥
        </label>
        <textarea
          value={today}
          onChange={(e) => setToday(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={3}
          placeholder="计划今天要完成的任务..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          有没有卡住的地方
        </label>
        <textarea
          value={blocker}
          onChange={(e) => setBlocker(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={2}
          placeholder="是否有阻碍你进展的问题？"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {isEditing ? '保存修改' : '提交'}
        </button>
      </div>
    </form>
  )
}
