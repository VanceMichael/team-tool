import { useState, useEffect } from 'react'
import { api } from '../utils/request'
import { Team, CalendarDay, DayRecords } from '../types'
import { Avatar } from '../components/Avatar'
import { Modal } from '../components/Modal'

export function CalendarPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [calendar, setCalendar] = useState<CalendarDay[]>([])
  const [loading, setLoading] = useState(false)

  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dayRecords, setDayRecords] = useState<DayRecords | null>(null)

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
      loadCalendar(selectedTeam.id)
    }
  }, [selectedTeam])

  const loadCalendar = async (teamId: number) => {
    setLoading(true)
    try {
      const data = await api.get<CalendarDay[]>(`/standup/calendar/${teamId}`)
      setCalendar(data)
    } catch (error) {
      console.error('加载日历失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDayRecords = async (date: string) => {
    if (!selectedTeam) return
    try {
      const records = await api.get<DayRecords>(`/standup/day/${selectedTeam.id}?date=${date}`)
      setDayRecords(records)
      setSelectedDate(date)
      setDetailModalOpen(true)
    } catch (error) {
      console.error('加载记录失败:', error)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  const getWeekday = (dateStr: string) => {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[new Date(dateStr).getDay()]
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📅</div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">您还没有加入任何组</h2>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">历史记录</h1>
          <p className="text-gray-500 mt-1">查看最近两周的站会记录</p>
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
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
          {calendar.map((day) => (
            <div
              key={day.date}
              onClick={() => loadDayRecords(day.date)}
              className={`p-4 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                day.allSubmitted
                  ? 'bg-green-50 border-2 border-green-200'
                  : day.submittedCount > 0
                  ? 'bg-yellow-50 border-2 border-yellow-200'
                  : 'bg-gray-50 border-2 border-gray-200'
              }`}
            >
              <div className="text-sm text-gray-500 mb-1">{getWeekday(day.date)}</div>
              <div className="text-lg font-semibold text-gray-800">{formatDate(day.date)}</div>
              <div className="text-sm text-gray-600 mt-2">
                {day.submittedCount}/{day.totalMembers} 人已提交
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setDayRecords(null)
          setSelectedDate(null)
        }}
        title={selectedDate ? `${formatDate(selectedDate)} 站会记录` : ''}
      >
        {dayRecords && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {dayRecords.members.map((member) => (
              <div
                key={member.user.id}
                className={`p-4 rounded-xl ${
                  member.hasRecord ? 'bg-white border border-gray-200' : 'bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <Avatar user={member.user} size="sm" />
                  <span className="font-medium text-gray-800">{member.user.nickname}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    member.hasRecord
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {member.hasRecord ? '已提交' : '未提交'}
                  </span>
                </div>
                {member.hasRecord && member.record && (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">昨天：</span>
                      <span className="text-gray-700">{member.record.yesterday || '-'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">今天：</span>
                      <span className="text-gray-700">{member.record.today || '-'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">卡住：</span>
                      <span className="text-gray-700">{member.record.blocker || '无'}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
