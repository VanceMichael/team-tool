export interface ApiResponse<T> {
  code: number
  data: T
  msg: string
}

export interface User {
  id: number
  username: string
  nickname: string
  avatar: string | null
  role: string
}

export interface Team {
  id: number
  name: string
  leaderId: number
}

export interface StandupRecord {
  id: number
  userId: number
  teamId: number
  recordDate: string
  yesterday: string
  today: string
  blocker: string
  createdAt: string
  updatedAt: string
}

export interface TeamMemberStatus {
  user: User
  hasRecord: boolean
  canEdit: boolean
  record?: StandupRecord
}

export interface DayRecords {
  date: string
  members: TeamMemberStatus[]
}

export interface CalendarDay {
  date: string
  submittedCount: number
  totalMembers: number
  allSubmitted: boolean
}
