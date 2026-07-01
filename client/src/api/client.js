import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api"
});

export const USER_TOKEN_KEY = "uncovered-user-token";
export const USER_PROFILE_KEY = "uncovered-user-profile";

export function getErrorMessage(error) {
  return error?.response?.data?.message || error.message || "Something went wrong";
}

export function getStoredUserToken() {
  return localStorage.getItem(USER_TOKEN_KEY) || "";
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_PROFILE_KEY) || "null");
  } catch {
    return null;
  }
}

export function saveUserSession({ token, user }) {
  if (token) {
    localStorage.setItem(USER_TOKEN_KEY, token);
  }
  if (user) {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
  }
}

export function clearUserSession() {
  localStorage.removeItem(USER_TOKEN_KEY);
  localStorage.removeItem(USER_PROFILE_KEY);
}

function userHeaders(token = getStoredUserToken()) {
  return token
    ? {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    : {};
}

export async function getConfig() {
  const { data } = await api.get("/config");
  return data;
}

export async function getStories(params = {}) {
  const { data } = await api.get("/stories", { params });
  return data.stories;
}

export async function getFeed(params = {}) {
  const { data } = await api.get("/feed", { params });
  return data.feed;
}

export async function getStory(slugOrId) {
  const { data } = await api.get(`/stories/${slugOrId}`);
  return data.story;
}

export async function getPodcasts(params = {}) {
  const { data } = await api.get("/podcasts", { params });
  return data.podcasts;
}

export async function getPodcast(slugOrId) {
  const { data } = await api.get(`/podcasts/${slugOrId}`);
  return data.podcast;
}

export async function signupUser(payload) {
  const { data } = await api.post("/auth/signup", payload);
  saveUserSession(data);
  return data;
}

export async function loginUser(payload) {
  const { data } = await api.post("/auth/login", payload);
  saveUserSession(data);
  return data;
}

export async function getCurrentUser(token = getStoredUserToken()) {
  const { data } = await api.get("/auth/me", userHeaders(token));
  saveUserSession({ token, user: data.user });
  return data.user;
}

export async function submitStory(formData, token = "") {
  const { data } = await api.post("/stories", formData, {
    ...userHeaders(token),
    headers: {
      ...userHeaders(token).headers,
      "Content-Type": "multipart/form-data"
    }
  });
  return data;
}

export async function submitStoryUpdate(storyId, payload, token = getStoredUserToken()) {
  const { data } = await api.post(
    `/stories/${storyId}/updates`,
    payload,
    userHeaders(token)
  );
  return data;
}

export async function submitAdvice(storyId, payload) {
  const { data } = await api.post(`/stories/${storyId}/advice`, payload);
  return data;
}

export async function submitComment(storyId, payload) {
  const { data } = await api.post(`/stories/${storyId}/comments`, payload);
  return data;
}

export async function reactToStory(storyId, type) {
  const { data } = await api.post(`/stories/${storyId}/reactions`, { type });
  return data.story;
}

export async function submitPodcastComment(podcastId, payload) {
  const { data } = await api.post(`/podcasts/${podcastId}/comments`, payload);
  return data;
}

export async function reactToPodcast(podcastId, type) {
  const { data } = await api.post(`/podcasts/${podcastId}/reactions`, { type });
  return data.podcast;
}

export async function sendContact(payload) {
  const { data } = await api.post("/contact", payload);
  return data;
}

function adminHeaders(token) {
  return {
    headers: {
      "x-admin-token": token
    }
  };
}

export async function adminLogin(payload) {
  const { data } = await api.post("/admin/login", payload);
  return data.token;
}

export async function getAdminMeta(token) {
  const { data } = await api.get("/admin/meta", adminHeaders(token));
  return data;
}

export async function getAdminStats(token) {
  const { data } = await api.get("/admin/stats", adminHeaders(token));
  return data.stats;
}

export async function getAdminStories(token, params = {}) {
  const { data } = await api.get("/admin/stories", {
    ...adminHeaders(token),
    params
  });
  return data.stories;
}

export async function getAdminPodcasts(token, params = {}) {
  const { data } = await api.get("/admin/podcasts", {
    ...adminHeaders(token),
    params
  });
  return data.podcasts;
}

export async function updateAdminStory(token, storyId, payload) {
  const { data } = await api.patch(
    `/admin/stories/${storyId}`,
    payload,
    adminHeaders(token)
  );
  return data.story;
}

export async function createAdminPodcast(token, formData) {
  const { data } = await api.post("/admin/podcasts", formData, {
    ...adminHeaders(token),
    headers: {
      ...adminHeaders(token).headers,
      "Content-Type": "multipart/form-data"
    }
  });
  return data.podcast;
}

export async function updateAdminPodcast(token, podcastId, payload) {
  const { data } = await api.patch(
    `/admin/podcasts/${podcastId}`,
    payload,
    adminHeaders(token)
  );
  return data.podcast;
}

export async function requestStoryInfo(token, storyId, note) {
  const { data } = await api.post(
    `/admin/stories/${storyId}/request-info`,
    { note },
    adminHeaders(token)
  );
  return data.story;
}
