import { useState, useEffect, useMemo } from 'react';
import {
  BellPlus,
  Bell,
  Cake,
  Heart,
  Star,
  Edit2,
  Trash2,
  Send,
  Loader2,
  ToggleLeft,
  ToggleRight,
  CalendarDays,
  RefreshCw,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  getGroups,
  getContacts,
  mockSendReminder,
} from '../services/api';
import toast from 'react-hot-toast';

const TYPE_CONFIG = {
  birthday: {
    icon: Cake,
    color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    dotColor: 'bg-indigo-400',
    label: 'Birthday',
  },
  anniversary: {
    icon: Heart,
    color: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    dotColor: 'bg-pink-400',
    label: 'Anniversary',
  },
  holiday: {
    icon: Star,
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    dotColor: 'bg-amber-400',
    label: 'Holiday',
  },
  custom: {
    icon: Bell,
    color: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    dotColor: 'bg-slate-400',
    label: 'Custom',
  },
};

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
];

const TYPE_FILTERS = [
  { key: 'all', label: 'All Types' },
  { key: 'birthday', label: 'Birthday' },
  { key: 'anniversary', label: 'Anniversary' },
  { key: 'holiday', label: 'Holiday' },
  { key: 'custom', label: 'Custom' },
];

const emptyForm = {
  title: '',
  message: '',
  type: 'birthday',
  date: '',
  recurringYearly: false,
  groups: [],
  contacts: [],
  subjectContact: '',
};

export default function RemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [groups, setGroups] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Delete
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingReminder, setDeletingReminder] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Send test
  const [sendingTest, setSendingTest] = useState(null);

  // Send result modal
  const [showSendResult, setShowSendResult] = useState(false);
  const [sendResult, setSendResult] = useState(null);

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
      toast.error('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  }

  // Filtered reminders
  const filtered = useMemo(() => {
    return reminders.filter((r) => {
      if (statusFilter === 'active' && r.active === false) return false;
      if (statusFilter === 'inactive' && r.active !== false) return false;
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;
      return true;
    });
  }, [reminders, statusFilter, typeFilter]);

  // ---------- Form helpers ----------
  const openAddModal = () => {
    setEditingReminder(null);
    setFormData(emptyForm);
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (reminder) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title || '',
      message: reminder.message || '',
      type: reminder.type || 'custom',
      date: reminder.date ? reminder.date.slice(0, 10) : '',
      recurringYearly: reminder.recurringYearly || false,
      groups:
        (reminder.groups || []).map((g) =>
          typeof g === 'string' ? g : g._id || g.id
        ) || [],
      contacts:
        (reminder.contacts || []).map((c) =>
          typeof c === 'string' ? c : c._id || c.id
        ) || [],
      subjectContact: reminder.subjectContact
        ? typeof reminder.subjectContact === 'string'
          ? reminder.subjectContact
          : reminder.subjectContact._id || reminder.subjectContact.id || ''
        : '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const toggleFormGroup = (groupId) => {
    setFormData((prev) => ({
      ...prev,
      groups: prev.groups.includes(groupId)
        ? prev.groups.filter((id) => id !== groupId)
        : [...prev.groups, groupId],
    }));
  };

  const toggleFormContact = (contactId) => {
    setFormData((prev) => ({
      ...prev,
      contacts: prev.contacts.includes(contactId)
        ? prev.contacts.filter((id) => id !== contactId)
        : [...prev.contacts, contactId],
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.date) errors.date = 'Date is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      if (editingReminder) {
        const res = await updateReminder(
          editingReminder._id || editingReminder.id,
          formData
        );
        setReminders((prev) =>
          prev.map((r) =>
            (r._id || r.id) === (editingReminder._id || editingReminder.id)
              ? res.data || res
              : r
          )
        );
        toast.success('Reminder updated');
      } else {
        const res = await createReminder({ ...formData, active: true });
        setReminders((prev) => [...prev, res.data || res]);
        toast.success('Reminder created');
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save reminder');
    } finally {
      setSaving(false);
    }
  };

  // ---------- Toggle active ----------
  const handleToggleActive = async (reminder) => {
    const newActive = reminder.active === false ? true : false;
    try {
      const res = await updateReminder(reminder._id || reminder.id, {
        ...reminder,
        active: newActive,
      });
      setReminders((prev) =>
        prev.map((r) =>
          (r._id || r.id) === (reminder._id || reminder.id)
            ? res.data || res
            : r
        )
      );
      toast.success(newActive ? 'Reminder activated' : 'Reminder deactivated');
    } catch (err) {
      toast.error('Failed to update reminder');
    }
  };

  // ---------- Delete ----------
  const confirmDelete = (reminder) => {
    setDeletingReminder(reminder);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!deletingReminder) return;
    setDeleting(true);
    try {
      await deleteReminder(deletingReminder._id || deletingReminder.id);
      setReminders((prev) =>
        prev.filter(
          (r) =>
            (r._id || r.id) !==
            (deletingReminder._id || deletingReminder.id)
        )
      );
      toast.success('Reminder deleted');
      setShowDeleteDialog(false);
    } catch (err) {
      toast.error('Failed to delete reminder');
    } finally {
      setDeleting(false);
    }
  };

  // ---------- Send Test ----------
  const handleSendTest = async (reminder) => {
    const rid = reminder._id || reminder.id;
    setSendingTest(rid);
    try {
      const res = await mockSendReminder(rid);
      const data = res?.data || res;
      setSendResult({
        reminder: data.reminder || { title: reminder.title, type: reminder.type },
        messages: data.messages || [],
        excluded: data.excluded || null,
        totalRecipients: data.totalRecipients || 0,
        sentAt: data.sentAt || new Date().toISOString(),
      });
      setShowSendResult(true);
    } catch (err) {
      toast.error('Failed to simulate send');
    } finally {
      setSendingTest(null);
    }
  };

  // Helper to resolve names
  const getContactName = (c) => {
    if (typeof c === 'object')
      return `${c.firstName || ''} ${c.lastName || ''}`.trim();
    const found = contacts.find((ct) => (ct._id || ct.id) === c);
    return found
      ? `${found.firstName || ''} ${found.lastName || ''}`.trim()
      : 'Unknown';
  };

  const getGroupName = (g) => {
    if (typeof g === 'object') return g.name;
    const found = groups.find((grp) => (grp._id || grp.id) === g);
    return found ? found.name : 'Unknown';
  };

  // ---------- Render ----------
  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="h-8 w-44 bg-slate-700 rounded animate-pulse" />
          <div className="h-10 w-36 bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-9 w-20 bg-slate-700 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-slate-800 border border-slate-700 rounded-xl p-6 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-700 rounded w-1/3" />
                  <div className="h-3 bg-slate-700 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reminders</h1>
          <p className="text-slate-400 text-sm mt-1">
            {reminders.length} reminder{reminders.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={openAddModal} className="flex items-center gap-2">
          <BellPlus className="w-4 h-4" />
          New Reminder
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Status */}
        <div className="flex gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                statusFilter === tab.key
                  ? 'bg-indigo-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex gap-1 flex-wrap">
          {TYPE_FILTERS.map((tf) => (
            <button
              key={tf.key}
              onClick={() => setTypeFilter(tf.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                typeFilter === tf.key
                  ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reminders List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={
            statusFilter !== 'all' || typeFilter !== 'all'
              ? 'No matching reminders'
              : 'No reminders yet'
          }
          description={
            statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first reminder to get started'
          }
          action={
            statusFilter === 'all' &&
            typeFilter === 'all' && (
              <Button onClick={openAddModal} className="flex items-center gap-2">
                <BellPlus className="w-4 h-4" />
                New Reminder
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((reminder) => {
            const rid = reminder._id || reminder.id;
            const config = TYPE_CONFIG[reminder.type] || TYPE_CONFIG.custom;
            const TypeIcon = config.icon;
            const isActive = reminder.active !== false;

            return (
              <Card
                key={rid}
                className={`p-5 hover:border-slate-600 transition-colors ${
                  !isActive ? 'opacity-60' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Type icon */}
                  <div
                    className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center border ${config.color}`}
                  >
                    <TypeIcon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-white font-medium">{reminder.title}</h3>
                      <Badge variant={reminder.type || 'custom'}>
                        {config.label}
                      </Badge>
                      {reminder.recurringYearly && (
                        <span className="inline-flex items-center gap-1 text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                          <RefreshCw className="w-3 h-3" />
                          Recurring yearly
                        </span>
                      )}
                    </div>

                    {reminder.message && (
                      <p className="text-slate-400 text-sm mt-1 line-clamp-1">
                        {reminder.message}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {reminder.date && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {new Date(reminder.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      )}

                      {/* Groups / contacts badges */}
                      {(reminder.groups || []).length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {(reminder.groups || []).map((g, i) => (
                            <span
                              key={i}
                              className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full"
                            >
                              {getGroupName(g)}
                            </span>
                          ))}
                        </div>
                      )}
                      {(reminder.contacts || []).length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {(reminder.contacts || []).slice(0, 3).map((c, i) => (
                            <span
                              key={i}
                              className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full"
                            >
                              {getContactName(c)}
                            </span>
                          ))}
                          {(reminder.contacts || []).length > 3 && (
                            <span className="text-xs text-slate-500">
                              +{(reminder.contacts || []).length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Toggle */}
                    <button
                      onClick={() => handleToggleActive(reminder)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isActive
                          ? 'text-emerald-400 hover:bg-emerald-500/10'
                          : 'text-slate-500 hover:bg-slate-700'
                      }`}
                      title={isActive ? 'Deactivate' : 'Activate'}
                    >
                      {isActive ? (
                        <ToggleRight className="w-6 h-6" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>

                    {/* Send Test */}
                    <button
                      onClick={() => handleSendTest(reminder)}
                      disabled={sendingTest === rid}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-700 transition-colors disabled:opacity-50"
                      title="Send Test"
                    >
                      {sendingTest === rid ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => openEditModal(reminder)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => confirmDelete(reminder)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Reminder Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingReminder ? 'Edit Reminder' : 'New Reminder'}
      >
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Title *
            </label>
            <Input
              name="title"
              value={formData.title}
              onChange={handleFormChange}
              placeholder="e.g. John's Birthday"
              error={formErrors.title}
            />
            {formErrors.title && (
              <p className="text-red-400 text-xs mt-1">{formErrors.title}</p>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Message
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleFormChange}
              placeholder="Happy Birthday, {contact_name}! Hope you have a great {event_name}!"
              rows={3}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
            <p className="text-slate-500 text-xs mt-1">
              Available variables: {'{contact_name}'}, {'{event_name}'}
            </p>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleFormChange}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="birthday">Birthday</option>
              <option value="anniversary">Anniversary</option>
              <option value="holiday">Holiday</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Date *
            </label>
            <Input
              name="date"
              type="date"
              value={formData.date}
              onChange={handleFormChange}
              error={formErrors.date}
            />
            {formErrors.date && (
              <p className="text-red-400 text-xs mt-1">{formErrors.date}</p>
            )}
          </div>

          {/* Recurring */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="recurringYearly"
              checked={formData.recurringYearly}
              onChange={handleFormChange}
              className="w-4 h-4 rounded border-slate-600 text-indigo-500 focus:ring-indigo-500 bg-slate-900"
            />
            <span className="text-sm text-slate-300">Recurring yearly</span>
          </label>

          {/* Subject Contact — person this reminder is about (excluded from notifications) */}
          {contacts.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Who is this about?
              </label>
              <select
                name="subjectContact"
                value={formData.subjectContact}
                onChange={handleFormChange}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">None (notify everyone)</option>
                {contacts.map((contact) => {
                  const cid = contact._id || contact.id;
                  return (
                    <option key={cid} value={cid}>
                      {contact.firstName} {contact.lastName}
                    </option>
                  );
                })}
              </select>
              <p className="text-slate-500 text-xs mt-1">
                This person will NOT receive the notification (e.g., don't tell
                Dad about his own birthday surprise)
              </p>
            </div>
          )}

          {/* Groups multi-select */}
          {groups.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Notify Groups
              </label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {groups.map((group) => {
                  const gid = group._id || group.id;
                  return (
                    <label
                      key={gid}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.groups.includes(gid)}
                        onChange={() => toggleFormGroup(gid)}
                        className="w-4 h-4 rounded border-slate-600 text-indigo-500 focus:ring-indigo-500 bg-slate-900"
                      />
                      <div className="flex items-center gap-2">
                        {group.color && (
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: group.color }}
                          />
                        )}
                        <span className="text-sm text-white">{group.name}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Contacts multi-select */}
          {contacts.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Notify Individual Contacts
              </label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {contacts.map((contact) => {
                  const cid = contact._id || contact.id;
                  return (
                    <label
                      key={cid}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.contacts.includes(cid)}
                        onChange={() => toggleFormContact(cid)}
                        className="w-4 h-4 rounded border-slate-600 text-indigo-500 focus:ring-indigo-500 bg-slate-900"
                      />
                      <span className="text-sm text-white">
                        {contact.firstName} {contact.lastName}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingReminder ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Reminder"
        message={`Are you sure you want to delete "${deletingReminder?.title}"? This action cannot be undone.`}
        confirmText={deleting ? 'Deleting...' : 'Delete'}
        loading={deleting}
        variant="danger"
      />

      {/* SMS Send Result Modal */}
      <Modal
        isOpen={showSendResult}
        onClose={() => setShowSendResult(false)}
        title="SMS Preview"
        size="lg"
      >
        {sendResult && (
          <div className="space-y-4">
            {/* Header summary */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Send className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-300">
                  {sendResult.totalRecipients} message{sendResult.totalRecipients !== 1 ? 's' : ''} would be sent
                </p>
                <p className="text-xs text-slate-400">
                  Simulated at {new Date(sendResult.sentAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Excluded person notice */}
            {sendResult.excluded && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <span className="text-amber-400 text-sm">⚠️</span>
                <p className="text-sm text-amber-300">
                  <strong>Excluded:</strong> {sendResult.excluded}
                </p>
              </div>
            )}

            {/* Message previews — phone bubble style */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {sendResult.messages.length === 0 ? (
                <p className="text-center text-slate-500 py-6 text-sm">
                  No recipients configured for this reminder.
                </p>
              ) : (
                sendResult.messages.map((msg, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-700 overflow-hidden animate-slide-in"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {/* Recipient header */}
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-800/80 border-b border-slate-700">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">
                        {(msg.contactName || '??').split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{msg.contactName}</p>
                        <p className="text-xs text-slate-500">{msg.to}</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                        {msg.status === 'simulated' ? '✓ Simulated' : msg.status}
                      </span>
                    </div>

                    {/* SMS bubble */}
                    <div className="p-4 bg-slate-900/50">
                      <div className="inline-block max-w-[85%] px-4 py-2.5 rounded-2xl rounded-bl-md bg-indigo-600 text-white text-sm leading-relaxed">
                        {msg.message}
                      </div>
                      <p className="text-[10px] text-slate-600 mt-1.5 ml-1">
                        {new Date(sendResult.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · SMS
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-700">
              <p className="text-xs text-slate-500">
                ⚡ This is a simulation. No real SMS was sent.
              </p>
              <Button variant="secondary" onClick={() => setShowSendResult(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
