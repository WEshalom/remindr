import { useState, useEffect, useRef, useMemo } from 'react';
import {
  UserPlus,
  Upload,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Cake,
  Loader2,
  FileUp,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import SearchBar from '../components/ui/SearchBar';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  getGroups,
} from '../services/api';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 12;

function getInitials(firstName, lastName) {
  return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();
}

function parseVCard(text) {
  const contacts = [];
  const vcards = text.split('BEGIN:VCARD');

  for (const vcard of vcards) {
    if (!vcard.trim()) continue;
    const contact = {};

    // FN (Full Name)
    const fnMatch = vcard.match(/FN[^:]*:(.*)/i);
    if (fnMatch) {
      const parts = fnMatch[1].trim().split(/\s+/);
      contact.firstName = parts[0] || '';
      contact.lastName = parts.slice(1).join(' ') || '';
    }

    // N (Structured Name) — fallback
    if (!contact.firstName) {
      const nMatch = vcard.match(/^N[^:]*:(.*)/im);
      if (nMatch) {
        const parts = nMatch[1].trim().split(';');
        contact.lastName = (parts[0] || '').trim();
        contact.firstName = (parts[1] || '').trim();
      }
    }

    // TEL
    const telMatch = vcard.match(/TEL[^:]*:(.*)/i);
    if (telMatch) {
      contact.phone = telMatch[1].trim();
    }

    // EMAIL
    const emailMatch = vcard.match(/EMAIL[^:]*:(.*)/i);
    if (emailMatch) {
      contact.email = emailMatch[1].trim();
    }

    // BDAY
    const bdayMatch = vcard.match(/BDAY[^:]*:(.*)/i);
    if (bdayMatch) {
      const raw = bdayMatch[1].trim();
      // Format: YYYYMMDD or YYYY-MM-DD
      if (raw.length === 8) {
        contact.birthday = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
      } else {
        contact.birthday = raw;
      }
    }

    if (contact.firstName || contact.lastName) {
      contacts.push(contact);
    }
  }

  return contacts;
}

const emptyForm = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  birthday: '',
  notes: '',
  groups: [],
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Delete states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingContact, setDeletingContact] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // vCard import
  const [showImportModal, setShowImportModal] = useState(false);
  const [importedContacts, setImportedContacts] = useState([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [contactsRes, groupsRes] = await Promise.all([
        getContacts(),
        getGroups(),
      ]);
      setContacts(contactsRes.data || contactsRes);
      setGroups(groupsRes.data || groupsRes);
    } catch (err) {
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }

  // Search / filter
  const filtered = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(
      (c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        (c.phone || '').includes(q) ||
        (c.email || '').toLowerCase().includes(q)
    );
  }, [contacts, search]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  // ---------- Form helpers ----------
  const openAddModal = () => {
    setEditingContact(null);
    setFormData(emptyForm);
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (contact) => {
    setEditingContact(contact);
    setFormData({
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      phone: contact.phone || '',
      email: contact.email || '',
      birthday: contact.birthday ? contact.birthday.slice(0, 10) : '',
      notes: contact.notes || '',
      groups: contact.groups?.map((g) => (typeof g === 'string' ? g : g._id || g.id)) || [],
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

  const toggleGroup = (groupId) => {
    setFormData((prev) => ({
      ...prev,
      groups: prev.groups.includes(groupId)
        ? prev.groups.filter((id) => id !== groupId)
        : [...prev.groups, groupId],
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      if (editingContact) {
        const res = await updateContact(
          editingContact._id || editingContact.id,
          formData
        );
        setContacts((prev) =>
          prev.map((c) =>
            (c._id || c.id) === (editingContact._id || editingContact.id)
              ? res.data || res
              : c
          )
        );
        toast.success('Contact updated');
      } else {
        const res = await createContact(formData);
        setContacts((prev) => [...prev, res.data || res]);
        toast.success('Contact created');
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save contact');
    } finally {
      setSaving(false);
    }
  };

  // ---------- Delete ----------
  const confirmDelete = (contact) => {
    setDeletingContact(contact);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!deletingContact) return;
    setDeleting(true);
    try {
      await deleteContact(deletingContact._id || deletingContact.id);
      setContacts((prev) =>
        prev.filter(
          (c) =>
            (c._id || c.id) !== (deletingContact._id || deletingContact.id)
        )
      );
      toast.success('Contact deleted');
      setShowDeleteDialog(false);
    } catch (err) {
      toast.error('Failed to delete contact');
    } finally {
      setDeleting(false);
    }
  };

  // ---------- vCard Import ----------
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      const parsed = parseVCard(text);
      if (parsed.length === 0) {
        toast.error('No contacts found in file');
        return;
      }
      setImportedContacts(parsed);
      setShowImportModal(true);
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleImport = async () => {
    setImporting(true);
    let successCount = 0;
    try {
      for (const contact of importedContacts) {
        try {
          const res = await createContact(contact);
          setContacts((prev) => [...prev, res.data || res]);
          successCount++;
        } catch {
          // skip individual failures
        }
      }
      toast.success(`Imported ${successCount} of ${importedContacts.length} contacts`);
      setShowImportModal(false);
      setImportedContacts([]);
    } catch (err) {
      toast.error('Import failed');
    } finally {
      setImporting(false);
    }
  };

  // ---------- Render ----------
  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-slate-700 rounded animate-pulse" />
          <div className="h-10 w-32 bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="h-10 w-full bg-slate-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-slate-800 border border-slate-700 rounded-xl p-6 animate-pulse"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-700" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-slate-700 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-slate-700 rounded w-2/3 mb-2" />
              <div className="h-3 bg-slate-700 rounded w-1/2" />
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
          <h1 className="text-2xl font-bold text-white">Contacts</h1>
          <p className="text-slate-400 text-sm mt-1">
            {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".vcf,.vcard"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import vCard
          </Button>
          <Button onClick={openAddModal} className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search contacts by name, phone, or email..."
      />

      {/* Contacts Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'No contacts found' : 'No contacts yet'}
          description={
            search
              ? 'Try adjusting your search terms'
              : 'Get started by adding your first contact'
          }
          action={
            !search && (
              <Button onClick={openAddModal} className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Add Contact
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginated.map((contact) => {
              const contactGroups =
                contact.groups
                  ?.map((g) => {
                    if (typeof g === 'object') return g;
                    return groups.find((grp) => (grp._id || grp.id) === g);
                  })
                  .filter(Boolean) || [];

              return (
                <Card
                  key={contact._id || contact.id}
                  className="p-5 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-sm font-semibold text-indigo-300">
                        {getInitials(contact.firstName, contact.lastName)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">
                          {contact.firstName} {contact.lastName}
                        </p>
                        {contact.phone && (
                          <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {contact.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(contact)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => confirmDelete(contact)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    {contact.email && (
                      <p className="text-slate-400 flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </p>
                    )}
                    {contact.birthday && (
                      <p className="text-slate-400 flex items-center gap-2">
                        <Cake className="w-3.5 h-3.5 shrink-0" />
                        {new Date(contact.birthday).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>

                  {contactGroups.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-700">
                      {contactGroups.map((g) => (
                        <Badge key={g._id || g.id} variant="secondary">
                          {g.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-slate-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingContact ? 'Edit Contact' : 'Add Contact'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                First Name *
              </label>
              <Input
                name="firstName"
                value={formData.firstName}
                onChange={handleFormChange}
                placeholder="John"
                error={formErrors.firstName}
              />
              {formErrors.firstName && (
                <p className="text-red-400 text-xs mt-1">{formErrors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Last Name
              </label>
              <Input
                name="lastName"
                value={formData.lastName}
                onChange={handleFormChange}
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Phone
            </label>
            <Input
              name="phone"
              value={formData.phone}
              onChange={handleFormChange}
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Email
            </label>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleFormChange}
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Birthday
            </label>
            <Input
              name="birthday"
              type="date"
              value={formData.birthday}
              onChange={handleFormChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleFormChange}
              placeholder="Add any notes..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Groups multi-select */}
          {groups.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Groups
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {groups.map((group) => {
                  const gid = group._id || group.id;
                  const checked = formData.groups.includes(gid);
                  return (
                    <label
                      key={gid}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleGroup(gid)}
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
              {editingContact ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Contact"
        message={`Are you sure you want to delete ${deletingContact?.firstName} ${deletingContact?.lastName}? This action cannot be undone.`}
        confirmText={deleting ? 'Deleting...' : 'Delete'}
        loading={deleting}
        variant="danger"
      />

      {/* vCard Import Preview Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportedContacts([]);
        }}
        title="Import Contacts from vCard"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Found {importedContacts.length} contact
            {importedContacts.length !== 1 ? 's' : ''} in the file:
          </p>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {importedContacts.map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-slate-900 rounded-lg border border-slate-700"
              >
                <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-semibold text-indigo-300">
                  {getInitials(c.firstName, c.lastName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">
                    {c.firstName} {c.lastName}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    {c.phone && <span>{c.phone}</span>}
                    {c.email && <span>{c.email}</span>}
                    {c.birthday && <span>{c.birthday}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowImportModal(false);
                setImportedContacts([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center gap-2"
            >
              {importing && <Loader2 className="w-4 h-4 animate-spin" />}
              {importing ? 'Importing...' : `Import ${importedContacts.length} Contacts`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
