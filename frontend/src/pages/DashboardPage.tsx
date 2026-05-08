import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../utils/request'
import { Team, DayRecords, TeamMemberStatus, StandupRecord } from '../types'
import { Avatar } from '../components/Avatar'
import { Modal } from '../components/Modal'
import { StandupForm } from '../components/StandupForm'

export function DashboardPage() {
  const { user } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [dayRecords, setDayRecords] = useState<DayRecords | null>(null)
  const [loading, setLoading] = useState(false)

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMemberStatus | null>(null)

  useEffect(() => {
    loadTeams()
  }, [])

  const loadTeams = async () => {
    try {
      const myTeams = await api.get<Team[]>('/teams/my')
      setTeams(myTeams)
      if (myTeams.length > 0) {
        setSelectedTeam(myTeams[0])
      }
    } catch (error) {
      console.error('加载组失败:', error)
    }
  }

  useEffect(() => {
    if (selectedTeam) {
      loadDayRecords(selectedTeam.id)
    }
  }, [selectedTeam])

  const loadDayRecords = async (teamId: number) => {
    setLoading(true)
    try {
      const records = await api.get<DayRecords>(`/standup/day/${teamId}`)
      setDayRecords(records)
    } catch (error) {
      console.error('加载记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarClick = (member: TeamMemberStatus) => {
    if (member.canEdit) {
      setEditingMember(member)
      setEditModalOpen(true)
    }
  }

  const handleSubmit = async (data: { yesterday: string; today: string; blocker: string }) => {
    if (!selectedTeam || !user) return

    try {
      await api.post('/standup', {
        teamId: selectedTeam.id,
        ...data,
      })
      setEditModalOpen(false)
      setEditingMember(null)
      loadDayRecords(selectedTeam.id)
    } catch (error) {
      alert(error instanceof Error ? error.message : '提交失败')
    }
  }

  const handleUpdate = async (record: StandupRecord, data: { yesterday: string; today: string; blocker: string }) => {
    if (!selectedTeam) return

    try {
      await api.put(`/standup/${record.id}`, {
        teamId: selectedTeam.id,
        ...data,
      })
      setEditModalOpen(false)
      setEditingMember(null)
      loadDayRecords(selectedTeam.id)
    } catch (error) {
      alert(error instanceof Error ? error.message : '更新失败')
    }
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">👥</div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">您还没有加入任何组</h2>
        <p className="text-gray-500">请联系管理员或组长将您添加到组中</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">今日站会</h1>
          <p className="text-gray-500 mt-1">{new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-gray-600">选择组：</span>
          <select
            value={selectedTeam?.id || ''}
            onChange={(e) => {
              const team = teams.find(t => t.id === Number(e.target.value))
              if (team) setSelectedTeam(team)
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : dayRecords ? (
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex flex-wrap gap-8 justify-center">
            {dayRecords.members.map((member) => (
              <div key={member.user.id} className="flex flex-col items-center">
                <div className="relative">
                  <Avatar
                    user={member.user}
                    size="lg"
                    onClick={() => handleAvatarClick(member)}
                  />
                  {member.hasRecord && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      ✓
                    </div>
                  )}
                </div>
                <span className="mt-2 text-sm font-medium text-gray-700">
                  {member.user.nickname}
                </span>
                <span className="text-xs text-gray-500">
                  {member.hasRecord ? '已提交' : '未提交'}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">详细内容</h3>
            <div className="space-y-4">
              {dayRecords.members.filter(m => m.hasRecord && m.record).map((member) => (
                <div
                  key={member.user.id}
                  className="bg-gray-50 rounded-xl p-4"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <Avatar user={member.user} size="sm" />
                    <span className="font-medium text-gray-800">{member.user.nickname}</span>
                    {member.canEdit && (
                      <button
                        onClick={() => handleAvatarClick(member)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        编辑
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">昨天干了啥</div>
                      <div className="text-sm text-gray-700">{member.record?.yesterday || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">今天准备干啥</div>
                      <div className="text-sm text-gray-700">{member.record?.today || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">有没有卡住</div>
                      <div className="text-sm text-gray-700">{member.record?.blocker || '无'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setEditingMember(null)
        }}
        title={editingMember?.hasRecord ? '编辑站会记录' : '填写站会记录'}
      >
        {editingMember && (
          <StandupForm
            initialData={editingMember.record}
            isEditing={editingMember.hasRecord}
            onSubmit={(data) => {
              if (editingMember.record) {
                handleUpdate(editingMember.record, data)
              } else {
                handleSubmit(data)
              }
            }}
            onCancel={() => {
              setEditModalOpen(false)
              setEditingMember(null)
            }}
          />
        )}
      </Modal>
    </div>
  )
}
