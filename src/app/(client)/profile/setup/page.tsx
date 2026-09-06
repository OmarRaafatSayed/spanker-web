"use client"

// =============================================================================
// /profile/setup — first-time profile setup after registration
// =============================================================================

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm }   from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z }         from "zod"
import { Loader2, Sparkles } from "lucide-react"
import Image         from "next/image"
import { portalApi } from "@/lib/portal-api/client"
import { useAuthStore } from "@/modules/auth/store/authStore"
import { Button }    from "@/components/ui/button"
import { Input }     from "@/components/ui/input"
import { Label }     from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn }        from "@/lib/utils"

const schema = z.object({
  first_name: z.string().min(2, "First name is required"),
  last_name:  z.string().min(2, "Last name is required"),
  phone:      z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export default function ProfileSetupPage() {
  const router              = useRouter()
  const { setProfile }      = useAuthStore()
  const [isLoading, setLoading] = useState(false)
  const [error,     setError]   = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    setError(null)
    try {
      const p = await portalApi.setupProfile(values)
      // Persist to auth store
      setProfile({
        id:         p.id,
        user_id:    p.user_id,
        full_name:  `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
        phone:      p.phone ?? "",
        role:       (p.role as "admin" | "staff" | "customer") ?? "customer",
        created_at: p.created_at ?? "",
        updated_at: p.updated_at ?? "",
      })
      router.replace("/dashboard")
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Failed to save profile")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/width-logo.png"
            alt="Spanker Travel"
            width={160}
            height={48}
            className="h-10 w-auto object-contain"
            priority
          />
        </div>

        <Card>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-brand-green/10">
              <Sparkles className="h-6 w-6 text-brand-green" />
            </div>
            <CardTitle className="text-2xl">Almost there!</CardTitle>
            <CardDescription>
              Tell us your name so we can personalise your experience.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="setup_first">First name</Label>
                  <Input
                    id="setup_first"
                    placeholder="John"
                    autoFocus
                    className={cn(errors.first_name && "border-red-400")}
                    {...register("first_name")}
                  />
                  {errors.first_name && <p className="text-xs text-red-600">{errors.first_name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="setup_last">Last name</Label>
                  <Input
                    id="setup_last"
                    placeholder="Doe"
                    className={cn(errors.last_name && "border-red-400")}
                    {...register("last_name")}
                  />
                  {errors.last_name && <p className="text-xs text-red-600">{errors.last_name.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="setup_phone">
                  Phone <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="setup_phone"
                  type="tel"
                  placeholder="+20 100 000 0000"
                  {...register("phone")}
                />
              </div>

              <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                {isLoading
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Setting up…</>
                  : "Get started →"
                }
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
