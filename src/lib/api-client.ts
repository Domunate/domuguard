import { handleApiError } from "./error-handler"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface ApiResponse<T> {
  data: T
  message?: string
}

interface ApiError {
  message: string
  code?: string
  status?: number
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = await response.json()
    throw new Error(error.message || "API request failed")
  }
  const data: ApiResponse<T> = await response.json()
  return data.data
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const apiClient = {
  // Auth endpoints
  auth: {
    login: async (email: string, password: string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })
        return handleResponse<{ token: string }>(response)
      } catch (error) {
        handleApiError(error)
        throw error
      }
    },
  },

  // Document endpoints
  documents: {
    upload: async (file: File) => {
      try {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch(`${API_BASE_URL}/api/v1/documents/upload`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: formData,
        })
        return handleResponse<{ id: string; name: string }>(response)
      } catch (error) {
        handleApiError(error)
        throw error
      }
    },

    compare: async (document1Id: string, document2Id: string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/documents/compare`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ document1_id: document1Id, document2_id: document2Id }),
        })
        return handleResponse<{
          comparison_id: string
          status: string
          differences: Array<{
            type: string
            description: string
            location: string
          }>
        }>(response)
      } catch (error) {
        handleApiError(error)
        throw error
      }
    },

    getComparison: async (comparisonId: string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/documents/comparison/${comparisonId}`, {
          headers: getAuthHeaders(),
        })
        return handleResponse<{
          status: string
          differences: Array<{
            type: string
            description: string
            location: string
          }>
        }>(response)
      } catch (error) {
        handleApiError(error)
        throw error
      }
    },
  },

  // Project endpoints
  projects: {
    list: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/projects`, {
          headers: getAuthHeaders(),
        })
        return handleResponse<Array<{
          id: string
          name: string
          description: string
          documents: number
          last_updated: string
        }>>(response)
      } catch (error) {
        handleApiError(error)
        throw error
      }
    },

    create: async (name: string, description: string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/projects`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ name, description }),
        })
        return handleResponse<{
          id: string
          name: string
          description: string
          documents: number
          last_updated: string
        }>(response)
      } catch (error) {
        handleApiError(error)
        throw error
      }
    },

    update: async (id: string, name: string, description: string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/projects/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ name, description }),
        })
        return handleResponse<{
          id: string
          name: string
          description: string
          documents: number
          last_updated: string
        }>(response)
      } catch (error) {
        handleApiError(error)
        throw error
      }
    },

    delete: async (id: string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/projects/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        })
        return handleResponse<{ success: boolean }>(response)
      } catch (error) {
        handleApiError(error)
        throw error
      }
    },
  },
} 