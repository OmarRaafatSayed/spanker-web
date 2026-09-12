import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { AuthenticationError, AuthorizationError } from "./errors";

export async function createSupabaseServerClient() {
  return await createServerClient();
}

export async function requireUser(supabase?: Awaited<ReturnType<typeof createServerClient>>) {
  const client = supabase ?? await createServerClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new AuthenticationError("Authentication required");
  return user;
}

export async function requireCompleteProfile(
  supabaseOrUserId: Awaited<ReturnType<typeof createServerClient>> | string,
  userId?: string
) {
  let uid: string;
  let client: Awaited<ReturnType<typeof createServerClient>>;

  if (typeof supabaseOrUserId === "string") {
    uid = supabaseOrUserId;
    client = await createServerClient();
  } else {
    client = supabaseOrUserId;
    uid = userId!;
  }

  const { data: profile } = await client
    .from("profiles")
    .select("first_name, last_name, phone")
    .eq("id", uid)
    .single();

  if (!profile?.first_name || !profile?.last_name || !profile?.phone) {
    throw new AuthorizationError("Complete your profile before making a booking");
  }

  return profile;
}

export async function requireStaff(
  supabaseOrRoles?: Awaited<ReturnType<typeof createServerClient>> | Array<"admin" | "agent" | "reviewer">,
  allowedRoles?: Array<"admin" | "agent" | "reviewer">
) {
  let client: Awaited<ReturnType<typeof createServerClient>>;
  let roles: Array<"admin" | "agent" | "reviewer"> | undefined;

  if (Array.isArray(supabaseOrRoles)) {
    roles = supabaseOrRoles;
    client = await createServerClient();
  } else if (supabaseOrRoles && !Array.isArray(supabaseOrRoles)) {
    client = supabaseOrRoles;
    roles = allowedRoles;
  } else {
    client = await createServerClient();
    roles = allowedRoles;
  }

  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new AuthenticationError("Authentication required");

  const { data: profile } = await client
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const staffRoles = ["admin", "staff", "reviewer"];
  if (!profile || !staffRoles.includes(profile.role ?? "")) {
    throw new AuthorizationError("Staff access required");
  }

  if (roles && roles.length > 0) {
    const mappedRole = profile.role === "admin" ? "admin" : profile.role === "reviewer" ? "reviewer" : "agent";
    if (!roles.includes(mappedRole as "admin" | "agent" | "reviewer")) {
      throw new AuthorizationError(`Requires one of: ${roles.join(", ")}`);
    }
  }

  return { user, profile, userId: user.id, role: profile.role, id: user.id };
}

export async function requireOwnerOrStaff(
  supabaseOrOwnerId: Awaited<ReturnType<typeof createServerClient>> | string,
  resourceOwnerIdOrUndefined?: string
) {
  let client: Awaited<ReturnType<typeof createServerClient>>;
  let resourceOwnerId: string;

  if (typeof supabaseOrOwnerId === "string") {
    resourceOwnerId = supabaseOrOwnerId;
    client = await createServerClient();
  } else {
    client = supabaseOrOwnerId;
    resourceOwnerId = resourceOwnerIdOrUndefined!;
  }

  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new AuthenticationError("Authentication required");

  if (user.id === resourceOwnerId) return { user, isOwner: true };

  const { data: profile } = await client
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile || !["admin", "staff", "reviewer"].includes(profile.role ?? "")) {
    throw new AuthorizationError("Access denied");
  }

  return { user, isOwner: false };
}

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, ...(typeof data === "object" && data !== null ? data : { data }) }, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function notFoundResponse(message = "Not found") {
  return NextResponse.json({ success: false, error: message }, { status: 404 });
}

export function validationErrorResponse(details: Record<string, string[]> | string) {
  return NextResponse.json({ success: false, error: "Validation failed", details }, { status: 400 });
}

export function handleRPCError(error: unknown) {
  console.error("RPC Error:", error);
  if (error && typeof error === "object" && "message" in error) {
    return errorResponse((error as { message: string }).message, 400);
  }
  return errorResponse("Operation failed", 500);
}

