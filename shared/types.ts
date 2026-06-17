export interface User {
  id: number;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  createdAt: string;
}

export interface Habit {
  id: number;
  userId: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekly';
  targetCount: number;
  reminderTime: string;
  deadlineTime: string;
  isPublic: boolean;
  createdAt: string;
}

export interface CheckIn {
  id: number;
  userId: number;
  habitId: number;
  content: string;
  photos: string[];
  mood: number;
  createdAt: string;
}

export interface CheckInFeed extends CheckIn {
  username: string;
  avatar: string;
  habitName: string;
  habitIcon: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  type: 'streak' | 'total';
  earnedAt?: string;
}

export interface Team {
  id: number;
  name: string;
  description: string;
  habitId: number | null;
  creatorId: number;
  startDate: string;
  endDate: string;
  maxMembers: number;
  inviteCode: string;
  createdAt: string;
}

export interface TeamMember {
  id: number;
  teamId: number;
  userId: number;
  username: string;
  avatar: string;
  joinedAt: string;
  todayCompleted: boolean;
}

export interface TeamDetail extends Team {
  members: TeamMember[];
  dailyProgress: { date: string; completionRate: number }[];
  todayCompleted: number;
  totalMembers: number;
}

export interface Comment {
  id: number;
  checkinId: number;
  userId: number;
  username: string;
  avatar: string;
  content: string;
  createdAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  type: 'like' | 'comment' | 'follow' | 'badge' | 'reminder' | 'motivation';
  content: string;
  relatedId: number | null;
  isRead: boolean;
  createdAt: string;
}

export interface UserProfile extends User {
  totalCheckIns: number;
  currentStreak: number;
  followersCount: number;
  followingCount: number;
  badges: Badge[];
  isFollowing: boolean;
}

export interface HabitDetail extends Habit {
  currentStreak: number;
  longestStreak: number;
  monthlyCompletionRate: number;
  totalCheckIns: number;
  checkInHistory: CheckIn[];
  heatmapData: { date: string; count: number }[];
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  avatar?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  id: number;
  username: string;
  token: string;
  avatar: string;
}

export interface CreateHabitRequest {
  name: string;
  description: string;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekly';
  targetCount: number;
  reminderTime: string;
  deadlineTime: string;
  isPublic: boolean;
}

export interface CheckInRequest {
  habitId: number;
  content?: string;
  photos?: string[];
  mood?: number;
}

export interface CreateTeamRequest {
  name: string;
  description: string;
  targetHabitId: number | null;
  startDate: string;
  endDate: string;
  maxMembers: number;
}

export interface CommentRequest {
  content: string;
}

export interface FeedResponse {
  checkIns: CheckInFeed[];
  nextCursor: number;
}

export interface ExploreResponse {
  featured: CheckInFeed[];
  trending: CheckInFeed[];
  suggestedUsers: UserProfile[];
}

export interface TodayProgress {
  habitId: number;
  completed: boolean;
  currentCount: number;
  targetCount: number;
  completionRate: number;
}

export interface HabitStatistics {
  currentStreak: number;
  longestStreak: number;
  monthlyRate: number;
  totalCheckIns: number;
  badgesCount: number;
  heatmapData: { date: string; count: number }[];
  streaks: Record<number, number>;
}

export interface HabitListResponse {
  habits: Habit[];
  todayProgress: TodayProgress[];
}

export interface UserStatistics {
  user: User & { isFollowing?: boolean };
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  followersCount: number;
  followingCount: number;
  heatmapData: { date: string; count: number }[];
}

export interface ExploreUser {
  id: number;
  username: string;
  avatar: string;
  bio: string;
  isFollowing?: boolean;
  currentStreak: number;
  totalCheckIns: number;
}

export interface TeamProgress {
  date: string;
  completedRate: number;
}

export interface TeamMemberExtended {
  id: number;
  teamId: number;
  userId: number;
  username: string;
  avatar: string;
  joinedAt: string;
  todayCompleted: boolean;
  isCurrentUser: boolean;
  streak: number;
  totalCheckIns: number;
}

export interface TeamContribution {
  userId: number;
  username: string;
  avatar: string;
  checkInCount: number;
  streak: number;
  achievedDays: number;
  isCurrentUser: boolean;
}

export type ContributionPeriod = 'today' | 'week' | 'month';

export interface TeamExtended extends Team {
  icon: string;
  color: string;
  currentStreak: number;
  totalCheckIns: number;
  membersCount: number;
  targetCount: number;
  endDate: string;
  members: TeamMemberExtended[];
}

export interface HabitTrendDailyData {
  date: string;
  count: number;
  targetMet: boolean;
  checkIns: CheckIn[];
}

export interface HabitTrend {
  dailyData: HabitTrendDailyData[];
  achievedDays: number;
  missedDays: number;
  totalCheckIns: number;
  averagePerDay: number;
}
