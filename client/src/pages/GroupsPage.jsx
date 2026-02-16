import { useState, useEffect } from 'react';
import {
  FolderPlus,
  Edit2,
  Trash2,
  Users,
  ChevronDown,
  ChevronUp,
  Loader2,
  Palette,
  FolderOpen,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import {
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getContacts,
} from '../services/api';
import toast from 'react-hot-toast';

const PRESET_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#64748b', // slate
  '#a855f7', // purple
];

const PRESET_ICONS = [
  'users', 'heart', 'star', 'briefcase', 'home', 'gift',
  'music', 'coffee', 'book', 'globe', 'zap', 'flag',
];

function getInitials(firstName, lastName) {
  return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();
}

const emptyForm = {
  name: '',
  description: '',
  color: PRESET_COLORS[0],
  icon: 'users',
  members: [],
};

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Expanded group
  const [expandedId, setExpandedId] = useState(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Delete
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Manage members modal
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [managingGroup, setManagingGroup] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [savingMembers, setSavingMembers] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [groupsRes, contactsRes] = await Promise.all([
        getGroups(),
        getContacts(),
      ]);
      setGroups(groupsRes.data || groupsRes);
      setContacts(contactsRes.data || contactsRes);
    } catch (err) {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  }

  // Get members for a group
  const getGroupMembers = (group) => {
    const memberIds = (group.members || group.contacts || []).map((m) =>
      typeof m === 'string' ? m : m._id || m.id
    );
    return contacts.filter((c) => memberIds.includes(c._id || c.id));
  };

  // ---------- Form helpers ----------
  const openAddModal = () => {
    setEditingGroup(null);
    setFormData(emptyForm);
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name || '',
      description: group.description || '',
      color: group.color || PRESET_COLORS[0],
      icon: group.icon || 'users',
      members: (group.members || group.contacts || []).map((m) =>
        typeof m === 'string' ? m : m._id || m.id
      ),
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Group name is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      if (editingGroup) {
        const res = await updateGroup(
          editingGroup._id || editingGroup.id,
          formData
        );
        setGroups((prev) =>
          prev.map((g) =>
            (g._id || g.id) === (editingGroup._id || editingGroup.id)
              ? res.data || res
              : g
          )
        );
        toast.success('Group updated');
      } else {
        const res = await createGroup(formData);
        setGroups((prev) => [...prev, res.data || res]);
        toast.success('Group created');
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save group');
    } finally {
      setSaving(false);
    }
  };

  // ---------- Delete ----------
  const confirmDelete = (group) => {
    setDeletingGroup(group);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!deletingGroup) return;
    setDeleting(true);
    try {
      await deleteGroup(deletingGroup._id || deletingGroup.id);
      setGroups((prev) =>
        prev.filter(
          (g) =>
            (g._id || g.id) !== (deletingGroup._id || deletingGroup.id)
        )
      );
      if (expandedId === (deletingGroup._id || deletingGroup.id)) {
        setExpandedId(null);
      }
      toast.success('Group deleted');
      setShowDeleteDialog(false);
    } catch (err) {
      toast.error('Failed to delete group');
    } finally {
      setDeleting(false);
    }
  };

  // ---------- Manage Members ----------
  const openManageMembers = (group) => {
    setManagingGroup(group);
    setSelectedMembers(
      (group.members || group.contacts || []).map((m) =>
        typeof m === 'string' ? m : m._id || m.id
      )
    );
    setShowMembersModal(true);
  };

  const toggleMember = (contactId) => {
    setSelectedMembers((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSaveMembers = async () => {
    if (!managingGroup) return;
    setSavingMembers(true);
    try {
      const res = await updateGroup(managingGroup._id || managingGroup.id, {
        ...managingGroup,
        members: selectedMembers,
        contacts: selectedMembers,
      });
      setGroups((prev) =>
        prev.map((g) =>
          (g._id || g.id) === (managingGroup._id || managingGroup.id)
            ? res.data || res
            : g
        )
      );
      toast.success('Members updated');
      setShowMembersModal(false);
    } catch (err) {
      toast.error('Failed to update members');
    } finally {
      setSavingMembers(false);
    }
  };

  // ---------- Render ----------
  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 bg-slate-700 rounded animate-pulse" />
          <div className="h-10 w-36 bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-slate-800 border border-slate-700 rounded-xl p-6 animate-pulse"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-4 h-4 rounded-full bg-slate-700" />
                <div className="h-5 bg-slate-700 rounded w-1/2" />
              </div>
              <div className="h-3 bg-slate-700 rounded w-3/4 mb-4" />
              <div className="h-3 bg-slate-700 rounded w-1/3" />
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
          <h1 className="text-2xl font-bold text-white">Groups</h1>
          <p className="text-slate-400 text-sm mt-1">
            {groups.length} group{groups.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={openAddModal} className="flex items-center gap-2">
          <FolderPlus className="w-4 h-4" />
          Create Group
        </Button>
      </div>

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No groups yet"
          description="Create groups to organize your contacts and send targeted reminders"
          action={
            <Button onClick={openAddModal} className="flex items-center gap-2">
              <FolderPlus className="w-4 h-4" />
              Create Group
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => {
            const gid = group._id || group.id;
            const members = getGroupMembers(group);
            const isExpanded = expandedId === gid;

            return (
              <Card
                key={gid}
                className="p-5 hover:border-slate-600 transition-colors"
              >
                {/* Group Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: group.color || PRESET_COLORS[0] }}
                    />
                    <h3 className="text-white font-semibold truncate">
                      {group.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(group)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => confirmDelete(group)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {group.description && (
                  <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                    {group.description}
                  </p>
                )}

                {/* Member count + actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                  <div className="flex items-center gap-1.5 text-sm text-slate-400">
                    <Users className="w-4 h-4" />
                    {members.length} member{members.length !== 1 ? 's' : ''}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openManageMembers(group)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Manage
                    </button>
                    <button
                      onClick={() =>
                        setExpandedId(isExpanded ? null : gid)
                      }
                      className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Members */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-700 space-y-2 animate-slide-in">
                    {members.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-2">
                        No members yet
                      </p>
                    ) : (
                      members.map((contact) => (
                        <div
                          key={contact._id || contact.id}
                          className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/50"
                        >
                          <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-semibold text-indigo-300">
                            {getInitials(contact.firstName, contact.lastName)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-white truncate">
                              {contact.firstName} {contact.lastName}
                            </p>
                            {contact.phone && (
                              <p className="text-xs text-slate-400">
                                {contact.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Group Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingGroup ? 'Edit Group' : 'Create Group'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Group Name *
            </label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              placeholder="e.g. Family, Work Friends"
              error={formErrors.name}
            />
            {formErrors.name && (
              <p className="text-red-400 text-xs mt-1">{formErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              placeholder="Brief description of this group..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Palette className="w-4 h-4 inline mr-1" />
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, color }))
                  }
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color
                      ? 'border-white scale-110'
                      : 'border-transparent hover:border-slate-500'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_ICONS.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, icon: iconName }))
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    formData.icon === iconName
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {iconName}
                </button>
              ))}
            </div>
          </div>

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
              {editingGroup ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Manage Members Modal */}
      <Modal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        title={`Manage Members \u2014 ${managingGroup?.name || ''}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Select contacts to add or remove from this group.
          </p>

          {contacts.length === 0 ? (
            <p className="text-center text-slate-500 py-6 text-sm">
              No contacts available. Create contacts first.
            </p>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-1">
              {contacts.map((contact) => {
                const cid = contact._id || contact.id;
                const isSelected = selectedMembers.includes(cid);
                return (
                  <label
                    key={cid}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-500/10 border border-indigo-500/30'
                        : 'hover:bg-slate-700/50 border border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleMember(cid)}
                      className="w-4 h-4 rounded border-slate-600 text-indigo-500 focus:ring-indigo-500 bg-slate-900"
                    />
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-semibold text-indigo-300">
                      {getInitials(contact.firstName, contact.lastName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">
                        {contact.firstName} {contact.lastName}
                      </p>
                      {contact.phone && (
                        <p className="text-xs text-slate-400">{contact.phone}</p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">
              {selectedMembers.length} selected
            </span>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowMembersModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveMembers}
                disabled={savingMembers}
                className="flex items-center gap-2"
              >
                {savingMembers && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Members
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Group"
        message={`Are you sure you want to delete "${deletingGroup?.name}"? Contacts in this group will not be deleted.`}
        confirmText={deleting ? 'Deleting...' : 'Delete'}
        loading={deleting}
        variant="danger"
      />
    </div>
  );
}
