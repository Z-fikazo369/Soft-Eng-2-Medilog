// File: services/api.ts
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  // ❌ REMOVED: Default Content-Type header that was breaking FormData uploads
});

// ✅ Interceptor para sa Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ CRITICAL FIX: Only set Content-Type to JSON if NOT FormData
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }
    // ✅ If it IS FormData, let Axios automatically set multipart/form-data

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ Interceptor para sa 401 (Expired Token)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized! Logging out...");
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

// --- Interfaces ---

export interface User {
  _id: string;
  username: string;
  email: string;
  lrn: string;
  studentId: string;
  role: "student" | "admin";
  status: "pending" | "approved" | "rejected";
  defaultLoginMethod?: "email" | "studentId";
  isVerified: boolean;
  firstLoginCompleted: boolean;
  rememberMe: boolean;
  profilePictureUrl?: string;
  department?: string;
  program?: string;
  yearLevel?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
  requiresOTP?: boolean;
  email?: string;
}

export interface PaginatedRecordsResponse {
  records: any[];
  recordType: string;
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export interface SignupData {
  username: string;
  email: string;
  password?: string;
  lrn: string;
  studentId: string;
  preferredLoginMethod?: "email" | "studentId";
  role: "student" | "admin";
}

export interface LoginData {
  email: string;
  password: string;
  role?: "student" | "admin";
  captchaToken: string;
}

export interface OTPData {
  email: string;
  otp: string;
  rememberMe?: boolean;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ChangePasswordData {
  userId: string;
  oldPassword: string;
  newPassword: string;
}

export interface MedicalRecordData {
  studentId: string;
  studentName: string;
  studentEmail: string;
  recordType: "newStudent" | "monitoring" | "certificate";
  [key: string]: any;
}
export interface DashboardInsights {
  topProgram: {
    name: string;
    count: number;
  };
  symptomTrend: {
    thisWeek: number;
    lastWeek: number;
    changePercentage: number;
  };
}

export type SortConfig = {
  key: string;
  order: "asc" | "desc";
};

// --- Auth API (UPDATED with Backup Functions) ---
export const authAPI = {
  signup: async (data: FormData) => {
    const response = await api.post("/users", data);
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post("/login", data);
    return response.data;
  },

  verifyOTP: async (data: OTPData): Promise<AuthResponse> => {
    const response = await api.post("/verify-otp", data);
    return response.data;
  },

  resendOTP: async (email: string) => {
    const response = await api.post("/resend-otp", { email });
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordData) => {
    const response = await api.post("/forgot-password", data);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordData) => {
    const response = await api.post("/reset-password", data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordData) => {
    const response = await api.post("/users/change-password", data);
    return response.data;
  },

  getPendingAccounts: async () => {
    const response = await api.get("/accounts/pending");
    return response.data;
  },

  getAllStudentAccounts: async (page: number = 1, limit: number = 10) => {
    const response = await api.get(`/accounts/all?page=${page}&limit=${limit}`);
    return response.data;
  },

  approveAccount: async (userId: string, adminId: string) => {
    const response = await api.post(`/accounts/${userId}/approve`, {
      adminId,
    });
    return response.data;
  },

  rejectAccount: async (userId: string, adminId: string, reason?: string) => {
    const response = await api.post(`/accounts/${userId}/reject`, {
      adminId,
      reason,
    });
    return response.data;
  },

  getTotalStudentCount: async (): Promise<{ totalCount: number }> => {
    const response = await api.get("/accounts/total");
    return response.data;
  },

  createSystemBackup: async () => {
    const response = await api.post("/users/backup/create");
    return response.data;
  },

  getBackupList: async () => {
    const response = await api.get("/users/backup/list");
    return response.data;
  },

  downloadBackup: async (filename: string) => {
    const response = await api.get(`/users/backup/download/${filename}`, {
      responseType: "blob",
    });
    return response;
  },

  restoreSystem: async (formData: FormData) => {
    const response = await api.post("/users/backup/restore", formData);
    return response.data;
  },
};

// --- User API ---
export const userAPI = {
  uploadProfilePicture: async (userId: string, formData: FormData) => {
    const response = await api.post(`/users/${userId}/upload-pfp`, formData);
    return response.data;
  },
};

// --- Medical API ---
export const medicalAPI = {
  createRecord: async (data: any) => {
    const response = await api.post("/records", data);
    return response.data;
  },

  getStudentRecords: async (studentId: string, type?: string) => {
    const url = type
      ? `/records/student/${studentId}?type=${type}`
      : `/records/student/${studentId}`;
    const response = await api.get(url);
    return response.data;
  },

  getAllRecords: async (
    type?: string,
    page: number = 1,
    sortConfig: SortConfig[] = [{ key: "createdAt", order: "desc" }],
    limit: number = 10
  ): Promise<PaginatedRecordsResponse> => {
    const sortBy = sortConfig.map((s) => s.key).join(",");
    const sortOrder = sortConfig.map((s) => s.order).join(",");

    const url = type
      ? `/records/all?type=${type}&page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}&limit=${limit}`
      : `/records/all?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}&limit=${limit}`;

    const response = await api.get(url);
    return response.data;
  },

  updateRecord: async (id: string, recordType: string, data: any) => {
    const response = await api.put(`/records/${id}`, { recordType, ...data });
    return response.data;
  },

  deleteRecord: async (id: string, recordType: string) => {
    const response = await api.delete(
      `/records/${id}?recordType=${recordType}`
    );
    return response.data;
  },

  bulkDeleteRecords: async (ids: string[], recordType: string) => {
    const response = await api.post("/records/bulk-delete", {
      ids,
      recordType,
    });
    return response.data;
  },

  bulkUpdateStatus: async (
    ids: string[],
    recordType: string,
    status: "approved" | "rejected",
    adminId: string
  ) => {
    const response = await api.post("/records/bulk-update-status", {
      ids,
      recordType,
      status,
      adminId,
    });
    return response.data;
  },

  getAggregation: async (recordType: string) => {
    const response = await api.get(
      `/records/aggregation?recordType=${recordType}`
    );
    return response.data;
  },

  getClusteringAnalysis: async (
    recordType: string,
    days: number = 7,
    k: number = 3
  ) => {
    const response = await api.get(
      `/records/clustering?recordType=${recordType}&days=${days}&k=${k}`
    );
    return response.data;
  },

  getEnhancedClusteringAnalysis: async (
    days: number = 30,
    autoK: boolean = true,
    k: number = 3
  ) => {
    const response = await api.get(
      `/records/clustering/enhanced?days=${days}&autoK=${autoK}&k=${k}`
    );
    return response.data;
  },

  exportRecords: async (
    recordType: string,
    format: "csv" | "excel" = "csv",
    sortConfig: SortConfig[]
  ) => {
    const sortBy = sortConfig.map((s) => s.key).join(",");
    const sortOrder = sortConfig.map((s) => s.order).join(",");

    const response = await api.get(
      `/records/export?recordType=${recordType}&format=${format}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
      {
        responseType: "blob",
      }
    );
    return response;
  },

  getStudentNotifications: async (studentId: string) => {
    const response = await api.get(`/notifications/student/${studentId}`);
    return response.data;
  },

  getUnreadCount: async (studentId: string) => {
    const response = await api.get(
      `/notifications/student/${studentId}/unread-count`
    );
    return response.data;
  },

  markNotificationsAsRead: async (studentId: string) => {
    const response = await api.post(
      `/notifications/student/${studentId}/mark-read`
    );
    return response.data;
  },
};

export const analyticsAPI = {
  getDashboardInsights: async (): Promise<DashboardInsights> => {
    const response = await api.get("/analytics/insights");
    return response.data;
  },
};

export const adminActivityAPI = {
  logActivity: async (action: string, actionDetails: any = {}) => {
    const response = await api.post("/activity-logs", {
      action,
      actionDetails,
    });
    return response.data;
  },

  getActivityLogs: async (
    page: number = 1,
    limit: number = 20,
    adminId?: string,
    action?: string,
    startDate?: string,
    endDate?: string
  ) => {
    let url = `/activity-logs?page=${page}&limit=${limit}`;
    if (adminId) url += `&adminId=${adminId}`;
    if (action) url += `&action=${action}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;

    const response = await api.get(url);
    return response.data;
  },

  getActivitySummary: async (days: number = 7) => {
    const response = await api.get(`/activity-logs/summary?days=${days}`);
    return response.data;
  },
};

export default api;
