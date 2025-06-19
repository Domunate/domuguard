"use client"

import { useState, useEffect } from "react"
import { Plus, FolderGit2, FileText, MoreVertical } from "lucide-react"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { handleError, AppError } from "@/lib/error-handler"
import { apiClient } from "@/lib/api-client"

interface Project {
  id: string
  name: string
  description: string
  documents: number
  last_updated: string
}

export function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setIsLoading(true)
      const projectsList = await apiClient.projects.list()
      setProjects(projectsList)
    } catch (error) {
      handleError(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateProject = async () => {
    try {
      setIsLoading(true)
      const newProject = await apiClient.projects.create(
        "New Project",
        "Project description"
      )
      setProjects([...projects, newProject])
    } catch (error) {
      handleError(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      setIsLoading(true)
      await apiClient.projects.delete(projectId)
      setProjects(projects.filter((p) => p.id !== projectId))
    } catch (error) {
      handleError(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <h2 className="text-2xl font-bold">Projects</h2>
        <Button 
          className="w-full sm:w-auto"
          onClick={handleCreateProject}
          disabled={isLoading}
        >
          <Plus className="mr-2 h-4 w-4" />
          <span>{isLoading ? "Creating..." : "New Project"}</span>
        </Button>
      </div>
      <div className="grid gap-4">
        {projects.map((project) => (
          <Card key={project.id} className="p-4">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex items-start space-x-4">
                <FolderGit2 className="h-8 w-8 shrink-0 text-primary" />
                <div className="min-w-0">
                  <h3 className="font-medium">{project.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {project.description}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-4">
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>{project.documents} documents</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Last updated: {project.last_updated}
                    </span>
                  </div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={isLoading}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>View Details</DropdownMenuItem>
                  <DropdownMenuItem>Edit Project</DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => handleDeleteProject(project.id)}
                  >
                    Delete Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
} 
