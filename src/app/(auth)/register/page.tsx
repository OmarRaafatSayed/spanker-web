// =============================================================================
// /register — new customer registration page
// =============================================================================

import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { RegisterForm } from "@/modules/auth/components/RegisterForm"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Create Account — Spanker Travel",
  description: "Create your Spanker Travel customer account",
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <Link href="/">
            <Image
              src="/width-logo.png"
              alt="Spanker Travel"
              width={160}
              height={48}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <CardDescription>Start planning your next trip with us</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <RegisterForm />

            <p className="mt-5 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-brand-green font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
