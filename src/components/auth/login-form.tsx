"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export function LoginForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const formData = new URLSearchParams();
      formData.append('username', email); // FastAPI OAuth2 expects 'username' field
      formData.append('password', password);
      
      const response = await fetch(`${apiUrl}/api/v1/auth/token`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json"
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = "Invalid email or password";
        
        if (errorData.detail?.error_code === "RATE_LIMIT_EXCEEDED") {
          errorMessage = "Too many login attempts. Please try again later.";
        } else if (errorData.detail?.error_code === "ACCOUNT_LOCKED") {
          errorMessage = "Account is locked. Please contact support.";
        } else if (errorData.detail?.error_code === "2FA_TOKEN_REQUIRED") {
          errorMessage = "Two-factor authentication is required.";
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred during login",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email"
          required
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Enter your password"
          required
          disabled={isLoading}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </Button>
    </form>
  )
} 