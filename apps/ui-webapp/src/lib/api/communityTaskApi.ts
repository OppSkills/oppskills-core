import { buildAuthHeaders, createApiClient } from "./apiClient";

export type TaskPriority = "HIGH" | "MEDIUM" | "LOW";
export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type TaskThreadMessageType = "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT" | "ALERT";

export interface TaskThreadMessage {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: TaskThreadMessageType;
  content: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
}

export interface TaskResponse {
  id: string;
  communityId: string;
  title: string;
  description?: string;
  dueDate?: string;
  toUserId: string;
  toUserName: string;
  toUserAvatar?: string;
  byUserId: string;
  byUserName: string;
  byUserAvatar?: string;
  priority: TaskPriority;
  status: TaskStatus;
  tags: string[];
  optForMail: boolean;
  createdAt: string;
  updatedAt: string;
  messages?: TaskThreadMessage[];
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  dueDate?: string;
  toUserId: string;
  priority: TaskPriority;
  tags: string[];
  optForMail: boolean;
}

export interface CreateCommentRequest {
  type: TaskThreadMessageType;
  content: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface UpdateTaskStatusRequest {
  status: TaskStatus;
}

const API = createApiClient("/communities");

export async function createTask(
  token: string,
  communityId: string,
  data: CreateTaskRequest
): Promise<TaskResponse> {
  const res = await API.post(`/${communityId}/tasks`, data, {
    headers: buildAuthHeaders(token),
  });
  return res.data as TaskResponse;
}

export async function listTasks(
  token: string,
  communityId: string
): Promise<TaskResponse[]> {
  const res = await API.get(`/${communityId}/tasks`, {
    headers: buildAuthHeaders(token),
  });
  return res.data as TaskResponse[];
}

export async function getTask(
  token: string,
  communityId: string,
  taskId: string
): Promise<TaskResponse> {
  const res = await API.get(`/${communityId}/tasks/${taskId}`, {
    headers: buildAuthHeaders(token),
  });
  return res.data as TaskResponse;
}

export async function createComment(
  token: string,
  communityId: string,
  taskId: string,
  data: CreateCommentRequest
): Promise<TaskThreadMessage> {
  const res = await API.post(`/${communityId}/tasks/${taskId}/comments`, data, {
    headers: buildAuthHeaders(token),
  });
  return res.data as TaskThreadMessage;
}

export async function updateTaskStatus(
  token: string,
  communityId: string,
  taskId: string,
  data: UpdateTaskStatusRequest
): Promise<TaskResponse> {
  const res = await API.patch(`/${communityId}/tasks/${taskId}/status`, data, {
    headers: buildAuthHeaders(token),
  });
  return res.data as TaskResponse;
}

export async function deleteComment(
  token: string,
  communityId: string,
  taskId: string,
  commentId: string
): Promise<void> {
  await API.delete(`/${communityId}/tasks/${taskId}/comments/${commentId}`, {
    headers: buildAuthHeaders(token),
  });
}