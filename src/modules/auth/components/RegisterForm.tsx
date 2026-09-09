"use client"

// =============================================================================
// RegisterForm — new customer account registration
// =============================================================================

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/modules/auth/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input }  from "@/components/ui/input"
import { Label }  from "@/components/ui/label"
import { cn }     from "@/lib/utils"

const schema = z.object({
  first_name: z.string().min(2, "First name is required"),
  last_name:  z.string().min(2, "Last name is required"),
  email:      z.string().email("Invalid email address"),
  phone:      z.string().optional(),
  password:   z.string().min(8, "Password must be at least 8 characters"),
  confirm:    z.string(),
}).refine(d => d.password === d.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
})
type FormValues = z.infer<typeof schema>

export function RegisterForm() {
  const { register: authRegister, isLoading, error, clearError } = useAuth()
  const [showPw, setShowPw]           = useState(false)
  const [confirmed, setConfirmed]     = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    clearError()
    const result = await authRegister({
      email:      values.email,
      password:   values.password,
      first_name: values.first_name,
      last_name:  values.last_name,
      phone:      values.phone,
    })
    if (result?.email_confirmation_required) setConfirmed(true)
  }

  if (confirmed) {
    return (
      <div className="text-center space-y-4 py-6">
        <CheckCircle2 className="mx-auto h-12 w-12 text-brand-green" />
        <h3 className="text-lg font-semibold">Check your email</h3>
        <p className="text-sm text-muted-foreground">
          We sent a confirmation link. Click it to activate your account and then log in.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Name row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="first_name">First name</Label>
          <Input
            id="first_name"
            placeholder="John"
            className={cn(errors.first_name && "border-red-400")}
            {...register("first_name")}
          />
          {errors.first_name && <p className="text-xs text-red-600">{errors.first_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="last_name">Last name</Label>
          <Input
            id="last_name"
            placeholder="Doe"
            className={cn(errors.last_name && "border-red-400")}
            {...register("last_name")}
          />
          {errors.last_name && <p className="text-xs text-red-600">{errors.last_name.message}</p>}
        </div>
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="reg-email">Email</Label>
        <Input
          id="reg-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={cn(errors.email && "border-red-400")}
          {...register("email")}
        />
        {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone <span className="text-muted-foreground">(optional)</span></Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+20 100 000 0000"
          {...register("phone")}
        />
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="reg-password">Password</Label>
        <div className="relative">
          <Input
            id="reg-password"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            className={cn("pr-10", errors.password && "border-red-400")}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
      </div>

      {/* Confirm */}
      <div className="space-y-1.5">
        <Label htmlFor="confirm">Confirm password</Label>
        <div className="relative">
          <Input
            id="confirm"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            className={cn("pr-10", errors.confirm && "border-red-400")}
            {...register("confirm")}
          />
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.confirm && <p className="text-xs text-red-600">{errors.confirm.message}</p>}
      </div>

      <Button type="submit" className="w-full mt-2" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account…
          </>
        ) : (
          "Create account"
        )}
      </Button>
    </form>
  )
}
