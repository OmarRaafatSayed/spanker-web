import type { VisaApplicationsResponse } from "@/types/flights";
import { apiFetch } from "./api-utils";

export async function getMyVisaApplications(): Promise<VisaApplicationsResponse> {
  return apiFetch<VisaApplicationsResponse>("/visa/my-applications");
}
