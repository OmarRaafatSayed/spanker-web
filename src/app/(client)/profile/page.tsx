"use client"

// =============================================================================
// /profile — view & update customer profile
// =============================================================================

import { useEffect, useState } from "react"
import { useForm }      from "react-hook-form"
import { zodResolver }  from "@hookform/resolvers/zod"
import { z }            from "zod"
import { Loader2, User, CheckCircle2, AlertCircle } from "lucide-react"
import { portalApi }    from "@/lib/portal-api/client"
import { useAuthStore } from "@/modules/auth/store/authStore"
import { authService }  from "@/modules/auth/services/authService"
import { Button }       from "@/components/ui/button"
import { Input }        from "@/components/ui/input"
import { Label }        from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { cn }           from "@/lib/utils"
import { useRouter }    from "next/navigation"
import type { ProfileResponse } from "@/modules/portal/types/portal.types"

const schema = z.object({
  first_name: z.string().min(2, "First name is required"),
  last_name:  z.string().min(2, "Last name is required"),
  phone:      z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export default function ProfilePage() {
  const { user, logout }          = useAuthStore()
  const router                    = useRouter()
  const [profile,    setProfile]  = useState<ProfileResponse | null>(null)
  const [isLoading,  setLoading]  = useState(true)
  const [isSaving,   setSaving]   = useState(false)
  const [error,      setError]    = useState<string | null>(null)
  const [success,    setSuccess]  = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  // Load profile
  useEffect(() => {
    portalApi.getProfile()
      .then(p => {
        setProfile(p)
        reset({ first_name: p.first_name ?? "", last_name: p.last_name ?? "", phone: p.phone ?? "" })
      })
      .catch(err => setError((err as Error)?.message ?? "Failed to load profile"))
      .finally(() => setLoading(false))
  }, [reset])

  const onSubmit = async (values: FormValues) => {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      // The portal API exposes setup as a POST; for updates we reuse it
      const updated = await portalApi.setupProfile(values)
      setProfile(updated)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await authService.logout()
    logout()
    router.replace("/login")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-brand-green/10 flex items-center justify-center">
          <User className="w-6 h-6 text-brand-green" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {profile?.first_name ? `${profile.first_name} ${profile.last_name}` : "My Profile"}
          </h1>
          <p className="text-sm text-muted-foreground">{user?.email ?? profile?.email}</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Personal Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Profile updated successfully
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="first_name">First name</Label>
                <Input
                  id="first_name"
                  className={cn(errors.first_name && "border-red-400")}
                  {...register("first_name")}
                />
                {errors.first_name && <p className="text-xs text-red-600">{errors.first_name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_name">Last name</Label>
                <Input
                  id="last_name"
                  className={cn(errors.last_name && "border-red-400")}
                  {...register("last_name")}
                />
                {errors.last_name && <p className="text-xs text-red-600">{errors.last_name.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile_email">Email</Label>
              <Input
                id="profile_email"
                type="email"
                value={user?.email ?? profile?.email ?? ""}
                disabled
                className="opacity-60 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile_phone">Phone <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                id="profile_phone"
                type="tel"
                placeholder="+20 100 000 0000"
                {...register("phone")}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-400"
            onClick={handleLogout}
          >
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
