import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { SignupForm } from "@/modules/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Register — Spanker",
  description: "Create a new account",
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <Link href="/" className="shrink-0 hover:opacity-85 transition-opacity">
            <Image
              src="/width-logo.png"
              alt="Spanker"
              width={160}
              height={54}
              priority
              className="h-14 w-auto object-contain"
            />
          </Link>
          <h1 className="text-2xl font-bold">Create an Account</h1>
          <p className="text-muted-foreground">Get started with your travel planning</p>
        </div>

        <Card>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold">Sign Up</CardTitle>
            <CardDescription>Enter your details to create a new account</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <SignupForm />

            <p className="mt-5 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}