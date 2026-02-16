import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - unwrap data and handle 401 unauthorized
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ==================== Auth API ====================

export const loginUser = (credentials) => {
  return api.post('/auth/login', credentials);
};

export const registerUser = (userData) => {
  return api.post('/auth/register', userData);
};

export const getMe = () => {
  return api.get('/auth/me');
};

// ==================== Contacts API ====================

export const getContacts = (params) => {
  return api.get('/contacts', { params });
};

export const getContact = (id) => {
  return api.get(`/contacts/${id}`);
};

export const createContact = (contactData) => {
  return api.post('/contacts', contactData);
};

export const updateContact = (id, contactData) => {
  return api.put(`/contacts/${id}`, contactData);
};

export const deleteContact = (id) => {
  return api.delete(`/contacts/${id}`);
};

export const importContacts = (formData) => {
  return api.post('/contacts/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// ==================== Groups API ====================

export const getGroups = (params) => {
  return api.get('/groups', { params });
};

export const getGroup = (id) => {
  return api.get(`/groups/${id}`);
};

export const createGroup = (groupData) => {
  return api.post('/groups', groupData);
};

export const updateGroup = (id, groupData) => {
  return api.put(`/groups/${id}`, groupData);
};

export const deleteGroup = (id) => {
  return api.delete(`/groups/${id}`);
};

// ==================== Reminders API ====================

export const getReminders = (params) => {
  return api.get('/reminders', { params });
};

export const getReminder = (id) => {
  return api.get(`/reminders/${id}`);
};

export const createReminder = (reminderData) => {
  return api.post('/reminders', reminderData);
};

export const updateReminder = (id, reminderData) => {
  return api.put(`/reminders/${id}`, reminderData);
};

export const deleteReminder = (id) => {
  return api.delete(`/reminders/${id}`);
};

export const getUpcomingReminders = (params) => {
  return api.get('/reminders/upcoming', { params });
};

export const toggleReminder = (id) => {
  return api.patch(`/reminders/${id}/toggle`);
};

export const mockSendReminder = (id) => {
  return api.post(`/reminders/${id}/send`);
};

export default api;
