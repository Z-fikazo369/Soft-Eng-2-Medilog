import { adminActivityAPI } from "../services/api";

/**
 * Logs admin activity to the backend
 * @param action - The action performed (LOGIN, CREATE_RECORD, etc.)
 * @param actionDetails - Details about the action
 */
export const logAdminActivity = async (
  action: string,
  actionDetails: any = {}
) => {
  try {
    await adminActivityAPI.logActivity(action, actionDetails);
  } catch (error) {
    console.error("Failed to log activity:", error);
    // Don't throw error - activity logging shouldn't break the main action
  }
};

export default logAdminActivity;
