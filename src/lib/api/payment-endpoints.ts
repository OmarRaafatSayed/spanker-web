import type { PaymentsResponse } from "@/types/flights";
import { apiFetch } from "./api-utils";

export async function getMyPayments(): Promise<PaymentsResponse> {
  return apiFetch<PaymentsResponse>("/payments/my-payments");
}
