'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { format, formatDistanceToNow, isToday, isTomorrow, isPast, isFuture } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  Video, 
  FileText, 
  Download, 
  Edit, 
  Trash2, 
  Play, 
  Square, 
  Star, 
  MessageCircle, 
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  RotateCcw,
  Users,
  BookOpen,
  DollarSign
} from 'lucide-react';
import { useAuthStore } from '@/lib/state/auth';
import { sessionAPI, SessionSearchFilters, SessionStats } from '@/lib/api/sessions';
import { db, Session, SessionMaterial, User, TutorProfile, StudentProfile } from '@/lib/db/index';

interface SessionWithDetails extends Session {
  tutor?: User & { tutorProfile?: TutorProfile };
  student?: User & { studentProfile?: StudentProfile };
  materials?: SessionMaterial[];
}

interface SessionFilters {
  status: 'all' | Session['status'];
  subject: string;
  dateRange: 'all' | 'today' | 'week' | 'month';
  search: string;
}

const SessionsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<SessionWithDetails[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionWithDetails | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(new Set());

  const [filters, setFilters] = useState<SessionFilters>({
    status: 'all',
    subject: '',
    dateRange: 'all',
    search: ''
  });

  // Load sessions and stats on component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      loadSessions();
      loadSessionStats();
    }
  }, [isAuthenticated, user]);

  // Filter sessions when filters change
  useEffect(() => {
    applyFilters();
  }, [sessions, filters]);

  const loadSessions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const role = user.role === 'tutor' ? 'tutor' : 'student';
      const searchFilters: SessionSearchFilters = {};

      if (role === 'tutor') {
        searchFilters.tutorId = parseInt(user.id);
      } else {
        searchFilters.studentId = parseInt(user.id);
      }

      const sessionsData = await sessionAPI.getSessions(searchFilters);
      
      // Enrich sessions with user and material data
      const enrichedSessions = await Promise.all(
        sessionsData.map(async (session) => {
          const enriched: SessionWithDetails = { ...session };

          // Load tutor data
          if (role === 'student') {
            const tutor = await db.users.get(session.tutorId);
            if (tutor) {
              const tutorProfile = await db.getTutorProfile(session.tutorId);
              enriched.tutor = { ...tutor, tutorProfile };
            }
          }

          // Load student data
          if (role === 'tutor') {
            const student = await db.users.get(session.studentId);
            if (student) {
              const studentProfile = await db.studentProfiles.where('userId').equals(session.studentId).first();
              enriched.student = { ...student, studentProfile };
            }
          }

          // Load session materials
          if (session.id) {
            const materials = await db.sessionMaterials.where('sessionId').equals(session.id).toArray();
            enriched.materials = materials;
          }

          return enriched;
        })
      );

      setSessions(enrichedSessions);
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError('Failed to load sessions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadSessionStats = async () => {
    if (!user) return;

    try {
      const role = user.role === 'tutor' ? 'tutor' : 'student';
      const stats = await sessionAPI.getSessionStats(parseInt(user.id), role);
      setSessionStats(stats);
    } catch (err) {
      console.error('Error loading session stats:', err);
    }
  };

  const applyFilters = () => {
    let filtered = [...sessions];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(session => session.status === filters.status);
    }

    // Subject filter
    if (filters.subject) {
      filtered = filtered.filter(session => 
        session.subject.toLowerCase().includes(filters.subject.toLowerCase())
      );
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.scheduledAt);
        switch (filters.dateRange) {
          case 'today':
            return isToday(sessionDate);
          case 'week':
            const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            return sessionDate >= now && sessionDate <= weekFromNow;
          case 'month':
            const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            return sessionDate >= now && sessionDate <= monthFromNow;
          default:
            return true;
        }
      });
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(session => 
        session.title.toLowerCase().includes(searchTerm) ||
        session.subject.toLowerCase().includes(searchTerm) ||
        session.description?.toLowerCase().includes(searchTerm) ||
        (user?.role === 'student' && session.tutor?.firstName.toLowerCase().includes(searchTerm)) ||
        (user?.role === 'tutor' && session.student?.firstName.toLowerCase().includes(searchTerm))
      );
    }

    // Sort by scheduled date
    filtered.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

    setFilteredSessions(filtered);
  };

  const handleStartSession = async (session: SessionWithDetails) => {
    if (!user || !session.id) return;

    try {
      const result = await sessionAPI.startSession(session.id, parseInt(user.id));
      if (result.success && result.meetingUrl) {
        // Open classroom in new tab
        window.open(result.meetingUrl, '_blank');
        // Refresh sessions to update status
        await loadSessions();
      } else {
        setError(result.error || 'Failed to start session');
      }
    } catch (err) {
      console.error('Error starting session:', err);
      setError('Failed to start session. Please try again.');
    }
  };

  const handleEndSession = async (session: SessionWithDetails) => {
    if (!user || !session.id) return;

    try {
      const result = await sessionAPI.endSession(session.id, parseInt(user.id));
      if (result.success) {
        await loadSessions();
      } else {
        setError(result.error || 'Failed to end session');
      }
    } catch (err) {
      console.error('Error ending session:', err);
      setError('Failed to end session. Please try again.');
    }
  };

  const handleCancelSession = async (session: SessionWithDetails, reason?: string) => {
    if (!user || !session.id) return;

    try {
      const result = await sessionAPI.cancelSession(session.id, parseInt(user.id), reason);
      if (result.success) {
        await loadSessions();
        setShowCancelModal(false);
        setSelectedSession(null);
      } else {
        setError(result.error || 'Failed to cancel session');
      }
    } catch (err) {
      console.error('Error cancelling session:', err);
      setError('Failed to cancel session. Please try again.');
    }
  };

  const toggleSessionExpansion = (sessionId: number) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  const getStatusIcon = (status: Session['status']) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'ongoing':
        return <Play className="w-4 h-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'no-show':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Session['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no-show':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canStartSession = (session: SessionWithDetails) => {
    if (session.status !== 'scheduled') return false;
    const now = new Date();
    const sessionTime = new Date(session.scheduledAt);
    const timeDiff = Math.abs(now.getTime() - sessionTime.getTime()) / (1000 * 60); // minutes
    return timeDiff <= 15; // Can start within 15 minutes of scheduled time
  };

  const canReschedule = (session: SessionWithDetails) => {
    return session.status === 'scheduled' && isFuture(new Date(session.scheduledAt));
  };

  const canCancel = (session: SessionWithDetails) => {
    return session.status === 'scheduled' || session.status === 'ongoing';
  };

  // Group sessions by status for better organization
  const groupedSessions = useMemo(() => {
    const groups = {
      upcoming: filteredSessions.filter(s => s.status === 'scheduled' && isFuture(new Date(s.scheduledAt))),
      ongoing: filteredSessions.filter(s => s.status === 'ongoing'),
      completed: filteredSessions.filter(s => s.status === 'completed'),
      cancelled: filteredSessions.filter(s => s.status === 'cancelled' || s.status === 'no-show'),
      past: filteredSessions.filter(s => s.status === 'scheduled' && isPast(new Date(s.scheduledAt)))
    };
    return groups;
  }, [filteredSessions]);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Please log in to view your sessions.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Sessions</h1>
        <p className="text-gray-600">
          Manage your {user.role === 'tutor' ? 'tutoring' : 'learning'} sessions
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {sessionStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                <p className="text-2xl font-semibold text-gray-900">{sessionStats.totalSessions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">{sessionStats.completedSessions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Upcoming</p>
                <p className="text-2xl font-semibold text-gray-900">{sessionStats.upcomingSessions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  {user.role === 'tutor' ? 'Total Earnings' : 'Total Spent'}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${user.role === 'tutor' ? sessionStats.totalEarnings?.toFixed(2) : sessionStats.totalSpent?.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Subject Filter */}
          <input
            type="text"
            placeholder="Filter by subject..."
            value={filters.subject}
            onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />

          {/* Date Range Filter */}
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-6">
        {/* Ongoing Sessions */}
        {groupedSessions.ongoing.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Play className="h-5 w-5 text-green-500 mr-2" />
              Ongoing Sessions
            </h2>
            <div className="space-y-4">
              {groupedSessions.ongoing.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  user={user}
                  expanded={expandedSessions.has(session.id!)}
                  onToggleExpand={() => toggleSessionExpansion(session.id!)}
                  onStartSession={handleStartSession}
                  onEndSession={handleEndSession}
                  onReschedule={() => {
                    setSelectedSession(session);
                    setShowRescheduleModal(true);
                  }}
                  onCancel={() => {
                    setSelectedSession(session);
                    setShowCancelModal(true);
                  }}
                  canStart={canStartSession(session)}
                  canReschedule={canReschedule(session)}
                  canCancel={canCancel(session)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Sessions */}
        {groupedSessions.upcoming.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 text-blue-500 mr-2" />
              Upcoming Sessions
            </h2>
            <div className="space-y-4">
              {groupedSessions.upcoming.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  user={user}
                  expanded={expandedSessions.has(session.id!)}
                  onToggleExpand={() => toggleSessionExpansion(session.id!)}
                  onStartSession={handleStartSession}
                  onEndSession={handleEndSession}
                  onReschedule={() => {
                    setSelectedSession(session);
                    setShowRescheduleModal(true);
                  }}
                  onCancel={() => {
                    setSelectedSession(session);
                    setShowCancelModal(true);
                  }}
                  canStart={canStartSession(session)}
                  canReschedule={canReschedule(session)}
                  canCancel={canCancel(session)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Sessions */}
        {groupedSessions.completed.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              Completed Sessions
            </h2>
            <div className="space-y-4">
              {groupedSessions.completed.slice(0, 10).map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  user={user}
                  expanded={expandedSessions.has(session.id!)}
                  onToggleExpand={() => toggleSessionExpansion(session.id!)}
                  onStartSession={handleStartSession}
                  onEndSession={handleEndSession}
                  onReschedule={() => {
                    setSelectedSession(session);
                    setShowRescheduleModal(true);
                  }}
                  onCancel={() => {
                    setSelectedSession(session);
                    setShowCancelModal(true);
                  }}
                  canStart={false}
                  canReschedule={false}
                  canCancel={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredSessions.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.search || filters.status !== 'all' || filters.subject || filters.dateRange !== 'all'
                ? 'Try adjusting your filters to see more sessions.'
                : 'You don\'t have any sessions yet. Book a session to get started!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Session Card Component
interface SessionCardProps {
  session: SessionWithDetails;
  user: any;
  expanded: boolean;
  onToggleExpand: () => void;
  onStartSession: (session: SessionWithDetails) => void;
  onEndSession: (session: SessionWithDetails) => void;
  onReschedule: () => void;
  onCancel: () => void;
  canStart: boolean;
  canReschedule: boolean;
  canCancel: boolean;
}

const SessionCard: React.FC<SessionCardProps> = ({
  session,
  user,
  expanded,
  onToggleExpand,
  onStartSession,
  onEndSession,
  onReschedule,
  onCancel,
  canStart,
  canReschedule,
  canCancel
}) => {
  const otherUser = user.role === 'tutor' ? session.student : session.tutor;
  const sessionDate = new Date(session.scheduledAt);
  const isUpcoming = isFuture(sessionDate);
  const isToday = isToday(sessionDate);
  const isTomorrow = isTomorrow(sessionDate);

  const getDateLabel = () => {
    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';
    return format(sessionDate, 'MMM d, yyyy');
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{session.title}</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                {getStatusIcon(session.status)}
                <span className="ml-1 capitalize">{session.status}</span>
              </span>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {getDateLabel()}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {format(sessionDate, 'h:mm a')} ({session.duration} min)
              </div>
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 mr-1" />
                {session.subject}
              </div>
              {otherUser && (
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {otherUser.firstName} {otherUser.lastName}
                </div>
              )}
            </div>

            {session.description && (
              <p className="text-gray-600 text-sm mb-3">{session.description}</p>
            )}
          </div>

          <div className="flex items-center space-x-2 ml-4">
            {/* Action Buttons */}
            {session.status === 'ongoing' && (
              <>
                <button
                  onClick={() => window.open(`/classroom/${session.id}`, '_blank')}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Video className="h-4 w-4 mr-1" />
                  Join
                </button>
                <button
                  onClick={() => onEndSession(session)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Square className="h-4 w-4 mr-1" />
                  End
                </button>
              </>
            )}

            {canStart && (
              <button
                onClick={() => onStartSession(session)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Play className="h-4 w-4 mr-1" />
                Start
              </button>
            )}

            {canReschedule && (
              <button
                onClick={onReschedule}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reschedule
              </button>
            )}

            {canCancel && (
              <button
                onClick={onCancel}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Cancel
              </button>
            )}

            <button
              onClick={onToggleExpand}
              className="inline-flex items-center px-2 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Session Details */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Session Details</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Price:</span> ${session.price} {session.currency}
                  </div>
                  {session.isRecurring && (
                    <div>
                      <span className="font-medium">Recurring:</span> Yes
                    </div>
                  )}
                  {session.notes && (
                    <div>
                      <span className="font-medium">Notes:</span> {session.notes}
                    </div>
                  )}
                  {session.recordingUrl && (
                    <div>
                      <a
                        href={session.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <Video className="h-4 w-4 mr-1" />
                        View Recording
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Session Materials */}
              {session.materials && session.materials.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Session Materials</h4>
                  <div className="space-y-2">
                    {session.materials.map((material) => (
                      <div key={material.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-600">{material.name}</span>
                        </div>
                        <a
                          href={material.url}
                          download
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="mt-4 flex items-center space-x-4">
              {session.status === 'completed' && (
                <button className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800">
                  <Star className="h-4 w-4 mr-1" />
                  Rate Session
                </button>
              )}
              <button className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800">
                <MessageCircle className="h-4 w-4 mr-1" />
                Send Message
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionsPage;