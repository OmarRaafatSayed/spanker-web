"use client"

// =============================================================================
// LoginForm — email + password login for the customer portal
// =============================================================================

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/modules/auth/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input }  from "@/components/ui/input"
import { Label }  from "@/components/ui/label"
import { cn }     from "@/lib/utils"

const schema = z.object({
  email:    z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})
type FormValues = z.infer<typeof schema>

export function LoginForm() {
  const { login, isLoading, error, clearError } = useAuth()
  const [showPw, setShowPw] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    clearError()
    await login(values)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {/* Global error */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={cn(errors.email && "border-red-400 focus-visible:ring-red-400")}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className={cn("pr-10", errors.password && "border-red-400 focus-visible:ring-red-400")}
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
        {errors.password && (
          <p className="text-xs text-red-600">{errors.password.message}</p>
        )}
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  )
}
