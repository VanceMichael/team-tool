
import { User } from '../types'

interface AvatarProps {
  user: User
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}

export function Avatar({ user, size = 'md', onClick }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-16 h-16 text-xl',
    lg: 'w-24 h-24 text-2xl',
  }

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-red-500',
  ]

  const colorIndex = (user.id - 1) % colors.length
  const initial = (user.nickname || user.username).charAt(0).toUpperCase()

  return (
    <div
      className={`${sizes[size]} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-semibold cursor-pointer hover:ring-4 hover:ring-blue-200 transition-all duration-200`}
      onClick={onClick}
    >
      {initial}
    </div>
  )
}
