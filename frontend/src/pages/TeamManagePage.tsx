import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../utils/request'
import { Team, User } from '../types'
import { Avatar } from '../components/Avatar'
import { Modal } from '../components/Modal'

export function TeamManagePage() {
  const { user } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<User[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadTeams()
    loadAllUsers()
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

  const loadAllUsers = async () => {
    try {
      const users = await api.get<User[]>('/teams/users')
      setAllUsers(users)
    } catch (error) {
      console.error('加载用户失败:', error)
    }
  }

  useEffect(() => {
    if (selectedTeam) {
      loadMembers(selectedTeam.id)
    }
  }, [selectedTeam])

  const loadMembers = async (teamId: number) => {
    try {
      const data = await api.get<User[]>(`/teams/${teamId}/members`)
      setMembers(data)
    } catch (error) {
      console.error('加载成员失败:', error)
    }
  }

  const handleCreateTeam = async () => {
    if (!newTeamName.trim() || !user) return
    setLoading(true)
    try {
      await api.post('/teams', { name: newTeamName.trim() })
      setNewTeamName('')
      setCreateModalOpen(false)
      loadTeams()
    } catch (error) {
      alert(error instanceof Error ? error.message : '创建失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (userId: number) => {
    if (!selectedTeam) return
    try {
      await api.post(`/teams/${selectedTeam.id}/members`, { userId })
      setAddMemberModalOpen(false)
      loadMembers(selectedTeam.id)
    } catch (error) {
      alert(error instanceof Error ? error.message : '添加失败')
    }
  }

  const handleRemoveMember = async (userId: number) => {
    if (!selectedTeam || !user) return
    if (!confirm('确定要移除该成员吗？')) return

    try {
      await api.delete(`/teams/${selectedTeam.id}/members/${userId}`)
      loadMembers(selectedTeam.id)
    } catch (error) {
      alert(error instanceof Error ? error.message : '移除失败')
    }
  }

  const availableUsers = allUsers.filter(u => !members.find(m => m.id === u.id))

  const canManage = (team: Team) => {
    return user?.role === 'ADMIN' || team.leaderId === user?.id
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">组管理</h1>
          <p className="text-gray-500 mt-1">管理您的组和成员</p>
        </div>

        {(user?.role === 'ADMIN' || user?.role === 'LEADER') && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            新建组
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">我的组</h2>
          <div className="space-y-2">
            {teams.map((team) => (
              <div
                key={team.id}
                onClick={() => setSelectedTeam(team)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedTeam?.id === team.id
                    ? 'bg-blue-50 border-2 border-blue-200'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="font-medium text-gray-800">{team.name}</div>
                {team.leaderId === user?.id && (
                  <div className="text-xs text-blue-600 mt-1">我是组长</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-xl shadow-sm p-4">
          {selectedTeam ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  {selectedTeam.name} - 成员
                </h2>
                {canManage(selectedTeam) && (
                  <button
                    onClick={() => setAddMemberModalOpen(true)}
                    className="text-sm px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    添加成员
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar user={member} size="sm" />
                      <div>
                        <div className="font-medium text-gray-800">{member.nickname}</div>
                        <div className="text-xs text-gray-500">
                          {member.role === 'ADMIN' ? '管理员' : member.role === 'LEADER' ? '组长' : '成员'}
                          {member.id === selectedTeam.leaderId && ' · 组长'}
                        </div>
                      </div>
                    </div>
                    {canManage(selectedTeam) && member.id !== selectedTeam.leaderId && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        移除
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-gray-500">
              请选择一个组
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false)
          setNewTeamName('')
        }}
        title="新建组"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              组名称
            </label>
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入组名称"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setCreateModalOpen(false)
                setNewTeamName('')
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleCreateTeam}
              disabled={!newTeamName.trim() || loading}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '创建中...' : '创建'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={addMemberModalOpen}
        onClose={() => setAddMemberModalOpen(false)}
        title="添加成员"
      >
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {availableUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              没有可添加的用户
            </div>
          ) : (
            availableUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => handleAddMember(user.id)}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Avatar user={user} size="sm" />
                  <div>
                    <div className="font-medium text-gray-800">{user.nickname}</div>
                    <div className="text-xs text-gray-500">@{user.username}</div>
                  </div>
                </div>
                <span className="text-sm text-blue-600">添加</span>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  )
}
