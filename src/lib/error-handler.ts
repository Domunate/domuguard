import { toast } from "sonner"

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message)
    this.name = "AppError"
  }
}

export function handleError(error: unknown) {
  if (error instanceof AppError) {
    toast.error(error.message)
    return
  }

  if (error instanceof Error) {
    toast.error(error.message)
    return
  }

  toast.error("An unexpected error occurred")
}

export function handleApiError(error: unknown) {
  if (error instanceof Response) {
    error.json().then((data) => {
      toast.error(data.message || "API request failed")
    })
    return
  }

  handleError(error)
} 
