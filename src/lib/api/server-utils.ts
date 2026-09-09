import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function createSupabaseServerClient() {
  return await createServerClient();
}

export async function requireUser(supabase: Awaited<ReturnType<typeof createServerClient>>) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function requireCompleteProfile(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string
) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("has_complete_profile")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    throw new Error("Profile not found");
  }

  if (!profile.has_complete_profile) {
    throw new Error("Profile incomplete - please complete your profile first");
  }

  return profile;
}

export async function requireStaff(supabase: Awaited<ReturnType<typeof createServerClient>>) {
  const user = await requireUser(supabase);

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    throw new Error("Profile not found");
  }

  if (profile.role !== "staff" && profile.role !== "admin") {
    throw new Error("Forbidden - staff only");
  }

  return { user, profile };
}

export async function requireOwnerOrStaff(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  resourceOwnerId: string
) {
  const user = await requireUser(supabase);

  if (user.id === resourceOwnerId) {
    return { user, isOwner: true };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    throw new Error("Profile not found");
  }

  if (profile.role !== "staff" && profile.role !== "admin") {
    throw new Error("Forbidden");
  }

  return { user, isOwner: false };
}

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function notFoundResponse(message = "Not found") {
  return NextResponse.json({ success: false, error: message }, { status: 404 });
}

export function validationErrorResponse(details: Record<string, string[]>) {
  return NextResponse.json(
    { success: false, error: "Validation failed", details },
    { status: 400 }
  );
}

export function handleRPCError(error: any) {
  console.error("RPC Error:", error);
  if (error.message) {
    return errorResponse(error.message, 400);
  }
  return errorResponse("Operation failed", 500);
}
