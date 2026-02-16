import { useState, useEffect, useMemo } from 'react';
import { Cake, Heart, Star, Bell, CalendarDays } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { getReminders, getGroups, getContacts } from '../services/api';
import toast from 'react-hot-toast';

const TYPE_CONFIG = {
  birthday: {
    icon: Cake,
    color: '#6366f1',
    bgColor: '#6366f120',
    label: 'Birthday',
  },
  anniversary: {
    icon: Heart,
    color: '#ec4899',
    bgColor: '#ec489920',
    label: 'Anniversary',
  },
  holiday: {
    icon: Star,
    color: '#f59e0b',
    bgColor: '#f59e0b20',
    label: 'Holiday',
  },
  custom: {
    icon: Bell,
    color: '#64748b',
    bgColor: '#64748b20',
    label: 'Custom',
  },
};

export default function CalendarPage() {
  const [reminders, setReminders] = useState([]);
  const [groups, setGroups] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Event detail modal
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [remindersRes, groupsRes, contactsRes] = await Promise.all([
        getReminders(),
        getGroups(),
        getContacts(),
      ]);
      setReminders(remindersRes.data || remindersRes);
      setGroups(groupsRes.data || groupsRes);
      setContacts(contactsRes.data || contactsRes);
    } catch (err) {
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  }

  // Map reminders to FullCalendar events
  const calendarEvents = useMemo(() => {
    const events = [];
    const currentYear = new Date().getFullYear();

    reminders.forEach((reminder) => {
      if (!reminder.date) return;
      const config = TYPE_CONFIG[reminder.type] || TYPE_CONFIG.custom;
      const baseDate = new Date(reminder.date);

      if (reminder.recurringYearly) {
        // Show for current year - 1, current year, and current year + 1
        for (let offset = -1; offset <= 1; offset++) {
          const year = currentYear + offset;
          const eventDate = new Date(year, baseDate.getMonth(), baseDate.getDate());
          events.push({
            id: `${reminder._id || reminder.id}_${year}`,
            title: reminder.title,
            date: eventDate.toISOString().split('T')[0],
            backgroundColor: config.color,
            borderColor: config.color,
            textColor: '#ffffff',
            extendedProps: {
              reminder,
              type: reminder.type,
            },
          });
        }
      } else {
        events.push({
          id: reminder._id || reminder.id,
          title: reminder.title,
          date: baseDate.toISOString().split('T')[0],
          backgroundColor: config.color,
          borderColor: config.color,
          textColor: '#ffffff',
          extendedProps: {
            reminder,
            type: reminder.type,
          },
        });
      }
    });

    return events;
  }, [reminders]);

  // Handle event click
  const handleEventClick = (info) => {
    const reminder = info.event.extendedProps.reminder;
    setSelectedEvent(reminder);
    setShowDetailModal(true);
  };

  // Resolve group / contact names
  const getGroupName = (g) => {
    if (typeof g === 'object') return g.name;
    const found = groups.find((grp) => (grp._id || grp.id) === g);
    return found ? found.name : 'Unknown';
  };

  const getContactName = (c) => {
    if (typeof c === 'object')
      return `${c.firstName || ''} ${c.lastName || ''}`.trim();
    const found = contacts.find((ct) => (ct._id || ct.id) === c);
    return found
      ? `${found.firstName || ''} ${found.lastName || ''}`.trim()
      : 'Unknown';
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-40 bg-slate-700 rounded animate-pulse" />
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 animate-pulse">
          <div className="h-96 bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Calendar</h1>
        <p className="text-slate-400 text-sm mt-1">
          View all your reminders on a calendar
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(TYPE_CONFIG).map(([key, config]) => (
          <div key={key} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: config.color }}
            />
            <span className="text-sm text-slate-400">{config.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <Card className="p-4 sm:p-6">
        <div className="fc-dark-theme">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={calendarEvents}
            eventClick={handleEventClick}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: '',
            }}
            height="auto"
            dayMaxEvents={3}
            fixedWeekCount={false}
            eventDisplay="block"
            eventTimeFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short',
            }}
          />
        </div>
      </Card>

      {/* Event Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Reminder Details"
      >
        {selectedEvent && (
          <div className="space-y-4">
            {/* Type + Title */}
            <div className="flex items-center gap-3">
              {(() => {
                const config =
                  TYPE_CONFIG[selectedEvent.type] || TYPE_CONFIG.custom;
                const TypeIcon = config.icon;
                return (
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: config.bgColor,
                      color: config.color,
                    }}
                  >
                    <TypeIcon className="w-5 h-5" />
                  </div>
                );
              })()}
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {selectedEvent.title}
                </h3>
                <Badge variant={selectedEvent.type || 'custom'}>
                  {(TYPE_CONFIG[selectedEvent.type] || TYPE_CONFIG.custom).label}
                </Badge>
              </div>
            </div>

            {/* Message */}
            {selectedEvent.message && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">
                  Message
                </label>
                <p className="text-slate-300 text-sm bg-slate-900 rounded-lg p-3 border border-slate-700">
                  {selectedEvent.message}
                </p>
              </div>
            )}

            {/* Date */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">
                Date
              </label>
              <p className="text-white text-sm flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-slate-400" />
                {selectedEvent.date &&
                  new Date(selectedEvent.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                {selectedEvent.recurringYearly && (
                  <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                    Recurring yearly
                  </span>
                )}
              </p>
            </div>

            {/* Groups */}
            {(selectedEvent.groups || []).length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">
                  Groups
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedEvent.groups || []).map((g, i) => (
                    <span
                      key={i}
                      className="text-xs bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full"
                    >
                      {getGroupName(g)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contacts */}
            {(selectedEvent.contacts || []).length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">
                  Contacts
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedEvent.contacts || []).map((c, i) => (
                    <span
                      key={i}
                      className="text-xs bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full"
                    >
                      {getContactName(c)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Calendar custom dark theme styles */}
      <style>{`
        .fc-dark-theme .fc {
          --fc-border-color: #334155;
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: #1e293b;
          --fc-list-event-hover-bg-color: #273549;
          --fc-today-bg-color: rgba(99, 102, 241, 0.08);
          --fc-event-border-color: transparent;
        }

        .fc-dark-theme .fc .fc-toolbar-title {
          color: #f8fafc;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .fc-dark-theme .fc .fc-button {
          background-color: #1e293b;
          border-color: #334155;
          color: #94a3b8;
          font-size: 0.875rem;
          padding: 0.375rem 0.75rem;
          border-radius: 0.5rem;
          transition: all 0.15s;
        }

        .fc-dark-theme .fc .fc-button:hover {
          background-color: #273549;
          border-color: #475569;
          color: #f8fafc;
        }

        .fc-dark-theme .fc .fc-button-active,
        .fc-dark-theme .fc .fc-button:active {
          background-color: #6366f1 !important;
          border-color: #6366f1 !important;
          color: #ffffff !important;
        }

        .fc-dark-theme .fc .fc-col-header-cell {
          background-color: #1e293b;
          border-color: #334155;
        }

        .fc-dark-theme .fc .fc-col-header-cell-cushion {
          color: #94a3b8;
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.5rem;
        }

        .fc-dark-theme .fc .fc-daygrid-day-number {
          color: #94a3b8;
          font-size: 0.875rem;
          padding: 0.5rem;
        }

        .fc-dark-theme .fc .fc-day-today .fc-daygrid-day-number {
          color: #6366f1;
          font-weight: 700;
        }

        .fc-dark-theme .fc .fc-daygrid-day {
          border-color: #334155;
        }

        .fc-dark-theme .fc .fc-daygrid-day:hover {
          background-color: #273549;
        }

        .fc-dark-theme .fc .fc-event {
          border-radius: 0.375rem;
          padding: 0.125rem 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
        }

        .fc-dark-theme .fc .fc-event:hover {
          opacity: 0.85;
        }

        .fc-dark-theme .fc .fc-daygrid-more-link {
          color: #6366f1;
          font-weight: 600;
          font-size: 0.75rem;
        }

        .fc-dark-theme .fc .fc-scrollgrid {
          border-color: #334155;
        }

        .fc-dark-theme .fc .fc-day-other .fc-daygrid-day-number {
          color: #475569;
        }

        .fc-dark-theme .fc th {
          border-color: #334155;
        }

        .fc-dark-theme .fc td {
          border-color: #334155;
        }
      `}</style>
    </div>
  );
}
