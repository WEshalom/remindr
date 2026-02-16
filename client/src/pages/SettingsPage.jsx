import { useState, useRef } from 'react';
import {
  User,
  Mail,
  CalendarDays,
  Bell,
  Smartphone,
  Lock,
  Trash2,
  Download,
  Upload,
  Loader2,
  Shield,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { getContacts, getGroups, getReminders } from '../services/api';
import toast from 'react-hot-toast';

const LEAD_TIME_OPTIONS = [
  { value: '0', label: 'Day of event' },
  { value: '1', label: '1 day before' },
  { value: '3', label: '3 days before' },
  { value: '7', label: '1 week before' },
];

export default function SettingsPage() {
  const { user, logout } = useAuth();

  // Notification preferences (local state only)
  const [leadTime, setLeadTime] = useState('1');
  const [smsEnabled, setSmsEnabled] = useState(false);

  // Change password (mock)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete account
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Import file ref
  const importRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  // ---------- Change Password ----------
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleChangePassword = async () => {
    const errors = {};
    if (!passwordForm.currentPassword)
      errors.currentPassword = 'Current password is required';
    if (!passwordForm.newPassword)
      errors.newPassword = 'New password is required';
    else if (passwordForm.newPassword.length < 6)
      errors.newPassword = 'Password must be at least 6 characters';
    if (!passwordForm.confirmPassword)
      errors.confirmPassword = 'Please confirm your new password';
    else if (passwordForm.newPassword !== passwordForm.confirmPassword)
      errors.confirmPassword = 'Passwords do not match';

    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setChangingPassword(true);
    try {
      // Mock — in production this would call an API endpoint
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Password changed successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      toast.error('Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  // ---------- Delete Account ----------
  const handleDeleteAccount = async () => {
    try {
      // Mock — would call API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Account deleted');
      logout();
    } catch (err) {
      toast.error('Failed to delete account');
    }
  };

  // ---------- Export Data ----------
  const handleExport = async () => {
    setExporting(true);
    try {
      const [contactsRes, groupsRes, remindersRes] = await Promise.all([
        getContacts(),
        getGroups(),
        getReminders(),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        contacts: contactsRes.data || contactsRes,
        groups: groupsRes.data || groupsRes,
        reminders: remindersRes.data || remindersRes,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `remindr-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch (err) {
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  // ---------- Import Data ----------
  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result);
        const contactCount = data.contacts?.length || 0;
        const groupCount = data.groups?.length || 0;
        const reminderCount = data.reminders?.length || 0;

        // In production, you'd send this to the API to process
        toast.success(
          `Import preview: ${contactCount} contacts, ${groupCount} groups, ${reminderCount} reminders. Full import coming soon.`
        );
      } catch (err) {
        toast.error('Invalid JSON file');
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'N/A';

  return (
    <div className="space-y-8 max-w-3xl animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Section */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <User className="w-5 h-5 text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Profile</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-slate-900 rounded-lg border border-slate-700">
            <div className="w-14 h-14 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-lg font-bold text-indigo-300">
              {(user?.name || 'U')[0].toUpperCase()}
            </div>
            <div>
              <p className="text-white font-medium">{user?.name || 'User'}</p>
              <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5" />
                {user?.email || 'N/A'}
              </p>
              <p className="text-slate-500 text-xs flex items-center gap-1.5 mt-0.5">
                <CalendarDays className="w-3 h-3" />
                Member since {memberSince}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-amber-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            Notification Preferences
          </h2>
        </div>

        <div className="space-y-5">
          {/* Lead time */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Default Reminder Lead Time
            </label>
            <div className="flex flex-wrap gap-2">
              {LEAD_TIME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setLeadTime(option.value);
                    toast.success(`Lead time set to: ${option.label}`);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    leadTime === option.value
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* SMS toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-white">
                  SMS Notifications
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Send reminders via SMS to contacts
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSmsEnabled(!smsEnabled);
                toast.success(
                  smsEnabled ? 'SMS notifications disabled' : 'SMS notifications enabled'
                );
              }}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                smsEnabled ? 'bg-indigo-500' : 'bg-slate-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  smsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* Account Section */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-slate-500/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Account</h2>
        </div>

        <div className="space-y-5">
          {/* Change Password */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Change Password
            </h3>
            <div className="space-y-3">
              <div>
                <Input
                  name="currentPassword"
                  type="password"
                  placeholder="Current password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  error={passwordErrors.currentPassword}
                />
                {passwordErrors.currentPassword && (
                  <p className="text-red-400 text-xs mt-1">
                    {passwordErrors.currentPassword}
                  </p>
                )}
              </div>
              <div>
                <Input
                  name="newPassword"
                  type="password"
                  placeholder="New password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  error={passwordErrors.newPassword}
                />
                {passwordErrors.newPassword && (
                  <p className="text-red-400 text-xs mt-1">
                    {passwordErrors.newPassword}
                  </p>
                )}
              </div>
              <div>
                <Input
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  error={passwordErrors.confirmPassword}
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">
                    {passwordErrors.confirmPassword}
                  </p>
                )}
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={changingPassword}
                variant="secondary"
                className="flex items-center gap-2"
              >
                {changingPassword && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Change Password
              </Button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-4 border-t border-slate-700">
            <h3 className="text-sm font-medium text-red-400 mb-2">
              Danger Zone
            </h3>
            <p className="text-slate-500 text-xs mb-3">
              Once you delete your account, there is no going back. Please be
              certain.
            </p>
            <Button
              variant="danger"
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </Button>
          </div>
        </div>
      </Card>

      {/* Data Section */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Data</h2>
        </div>

        <div className="space-y-4">
          {/* Export */}
          <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700">
            <div>
              <p className="text-sm font-medium text-white">Export Data</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Download all your contacts, groups, and reminders as JSON
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {exporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>

          {/* Import */}
          <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700">
            <div>
              <p className="text-sm font-medium text-white">Import Data</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Import contacts, groups, and reminders from a JSON file
              </p>
            </div>
            <input
              ref={importRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
            <Button
              variant="secondary"
              onClick={() => importRef.current?.click()}
              disabled={importing}
              className="flex items-center gap-2"
            >
              {importing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {importing ? 'Importing...' : 'Import'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Delete Account Confirm */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete your account? All your data including contacts, groups, and reminders will be permanently deleted. This action cannot be undone."
        confirmText="Delete My Account"
        variant="danger"
      />
    </div>
  );
}
