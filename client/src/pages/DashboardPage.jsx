import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FolderOpen,
  Bell,
  CalendarDays,
  UserPlus,
  FolderPlus,
  BellPlus,
  Cake,
  Heart,
  Star,
  Phone,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { getContacts, getGroups, getReminders } from '../services/api';
import toast from 'react-hot-toast';

const typeConfig = {
  birthday: { icon: Cake, color: 'bg-indigo-500/10 text-indigo-400', label: 'Birthday' },
  anniversary: { icon: Heart, color: 'bg-pink-500/10 text-pink-400', label: 'Anniversary' },
  holiday: { icon: Star, color: 'bg-amber-500/10 text-amber-400', label: 'Holiday' },
  custom: { icon: Bell, color: 'bg-slate-500/10 text-slate-400', label: 'Custom' },
};

function SkeletonCard() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 animate-pulse">
      <div className="h-4 bg-slate-700 rounded w-1/3 mb-3" />
      <div className="h-8 bg-slate-700 rounded w-1/2" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-slate-700" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-700 rounded w-2/5" />
        <div className="h-3 bg-slate-700 rounded w-1/4" />
      </div>
    </div>
  );
}

function getInitials(firstName, lastName) {
  return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [contactsRes, groupsRes, remindersRes] = await Promise.all([
          getContacts(),
          getGroups(),
          getReminders(),
        ]);
        setContacts(contactsRes.data || contactsRes);
        setGroups(groupsRes.data || groupsRes);
        setReminders(remindersRes.data || remindersRes);
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Upcoming reminders: next 7 days
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const upcomingReminders = reminders
    .filter((r) => {
      if (!r.date) return false;
      const d = new Date(r.date);
      // For recurring yearly, compare month/day
      if (r.recurringYearly) {
        const reminderThisYear = new Date(today.getFullYear(), d.getMonth(), d.getDate());
        return reminderThisYear >= today && reminderThisYear <= sevenDaysFromNow;
      }
      return d >= today && d <= sevenDaysFromNow;
    })
    .sort((a, b) => {
      const da = new Date(a.date);
      const db = new Date(b.date);
      if (a.recurringYearly) da.setFullYear(today.getFullYear());
      if (b.recurringYearly) db.setFullYear(today.getFullYear());
      return da - db;
    })
    .slice(0, 5);

  // Active reminders
  const activeReminders = reminders.filter((r) => r.active !== false);

  // Upcoming this month
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const upcomingThisMonth = reminders.filter((r) => {
    if (!r.date) return false;
    const d = new Date(r.date);
    if (r.recurringYearly) {
      const reminderThisYear = new Date(today.getFullYear(), d.getMonth(), d.getDate());
      return reminderThisYear >= today && reminderThisYear <= endOfMonth;
    }
    return d >= today && d <= endOfMonth;
  });

  // Recent contacts (last 5)
  const recentContacts = [...contacts]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  const stats = [
    {
      label: 'Total Contacts',
      value: contacts.length,
      icon: Users,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
    },
    {
      label: 'Total Groups',
      value: groups.length,
      icon: FolderOpen,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Active Reminders',
      value: activeReminders.length,
      icon: Bell,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Upcoming This Month',
      value: upcomingThisMonth.length,
      icon: CalendarDays,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {user?.name || 'User'}
        </h1>
        <p className="text-slate-400 mt-1">{formattedDate}</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-slate-400">{stat.label}</span>
                    <div
                      className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}
                    >
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </Card>
              );
            })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Reminders */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white">
              Upcoming Reminders
            </h2>
            <button
              onClick={() => navigate('/reminders')}
              className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {loading ? (
            <div className="space-y-1 divide-y divide-slate-700">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : upcomingReminders.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">
                No upcoming reminders in the next 7 days
              </p>
            </div>
          ) : (
            <div className="space-y-1 divide-y divide-slate-700">
              {upcomingReminders.map((reminder) => {
                const type = typeConfig[reminder.type] || typeConfig.custom;
                const TypeIcon = type.icon;
                const reminderDate = new Date(reminder.date);
                if (reminder.recurringYearly) {
                  reminderDate.setFullYear(today.getFullYear());
                }

                return (
                  <div
                    key={reminder._id || reminder.id}
                    className="flex items-center gap-4 py-3"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg ${type.color} flex items-center justify-center`}
                    >
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {reminder.title}
                      </p>
                      <p className="text-xs text-slate-400">
                        {reminderDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                        {reminder.recurringYearly && (
                          <span className="text-indigo-400 ml-2">
                            Recurring yearly
                          </span>
                        )}
                      </p>
                    </div>
                    <Badge variant={reminder.type || 'custom'}>
                      {type.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Recent Contacts */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white">
              Recent Contacts
            </h2>
            <button
              onClick={() => navigate('/contacts')}
              className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {loading ? (
            <div className="space-y-1 divide-y divide-slate-700">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : recentContacts.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No contacts yet</p>
            </div>
          ) : (
            <div className="space-y-1 divide-y divide-slate-700">
              {recentContacts.map((contact) => (
                <div
                  key={contact._id || contact.id}
                  className="flex items-center gap-4 py-3"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-sm font-semibold text-indigo-300">
                    {getInitials(contact.firstName, contact.lastName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {contact.firstName} {contact.lastName}
                    </p>
                    {contact.phone && (
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {contact.phone}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate('/contacts')} className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Add Contact
          </Button>
          <Button
            onClick={() => navigate('/groups')}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <FolderPlus className="w-4 h-4" />
            Create Group
          </Button>
          <Button
            onClick={() => navigate('/reminders')}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <BellPlus className="w-4 h-4" />
            New Reminder
          </Button>
        </div>
      </Card>
    </div>
  );
}
