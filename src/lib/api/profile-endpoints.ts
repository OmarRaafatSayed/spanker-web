import type { CustomerProfile, UpdateProfileRequest } from "@/types/flights";
import { apiFetch } from "./api-utils";

export async function getProfile(): Promise<CustomerProfile> {
  return apiFetch<CustomerProfile>("/profile/me");
}

export async function updateProfile(data: UpdateProfileRequest): Promise<CustomerProfile> {
  return apiFetch<CustomerProfile>("/profile/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
