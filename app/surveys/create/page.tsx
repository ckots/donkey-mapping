"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Plus, Trash, Save, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
// Remove the import that's causing the recursion issue
// import { ensureUserExists } from "@/app/actions/user-actions"

// Question types
const QUESTION_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "select", label: "Select" },
  { value: "multiselect", label: "Multi-Select" },
  { value: "date", label: "Date" },
  { value: "location", label: "Location" },
]

// Question component with drag handle
function QuestionItem({ question, index, updateQuestion, removeQuestion }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: question.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="mb-6 bg-background rounded-lg border shadow-sm">
      <div className="flex items-center p-4 border-b">
        <div {...attributes} {...listeners} className="flex items-center justify-center mr-2 cursor-grab">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <Input
            value={question.title}
            onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
            placeholder="Question title"
            className="font-medium"
          />
        </div>
        <Button variant="ghost" size="icon" onClick={() => removeQuestion(question.id)} className="ml-2">
          <Trash className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`type-${question.id}`}>Question Type</Label>
            <Select value={question.type} onValueChange={(value) => updateQuestion(question.id, { type: value })}>
              <SelectTrigger id={`type-${question.id}`}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor={`required-${question.id}`}>Required</Label>
            <div className="flex items-center space-x-2 h-10 mt-2">
              <Switch
                id={`required-${question.id}`}
                checked={question.required}
                onCheckedChange={(checked) => updateQuestion(question.id, { required: checked })}
              />
              <Label htmlFor={`required-${question.id}`}>{question.required ? "Yes" : "No"}</Label>
            </div>
          </div>
        </div>

        {question.type === "location" && (
          <div className="col-span-2 mt-2 p-3 bg-muted rounded-md">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id={`default-location-${question.id}`}
                  checked={question.captureCurrentLocation ?? true}
                  onCheckedChange={(checked) => updateQuestion(question.id, { captureCurrentLocation: checked })}
                />
                <Label htmlFor={`default-location-${question.id}`}>Capture respondent's current location</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id={`map-selection-${question.id}`}
                  checked={question.allowMapSelection ?? false}
                  onCheckedChange={(checked) => updateQuestion(question.id, { allowMapSelection: checked })}
                />
                <Label htmlFor={`map-selection-${question.id}`}>Allow selection from map</Label>
              </div>

              <p className="text-xs text-muted-foreground mt-1">
                Location questions will prompt users to share their current GPS coordinates or select a location on a
                map.
              </p>
            </div>
          </div>
        )}

        {question.type === "select" || question.type === "multiselect" ? (
          <div>
            <Label>Options (one per line)</Label>
            <Textarea
              value={question.options?.join("\n") || ""}
              onChange={(e) => updateQuestion(question.id, { options: e.target.value.split("\n").filter(Boolean) })}
              placeholder="Enter options here, one per line"
              rows={4}
            />
          </div>
        ) : null}

        <div className="flex items-center space-x-2">
          <Switch
            id={`public-${question.id}`}
            checked={question.isPublic}
            onCheckedChange={(checked) => updateQuestion(question.id, { isPublic: checked })}
          />
          <Label htmlFor={`public-${question.id}`}>Make responses to this question publicly visible on the map</Label>
        </div>

        <div>
          <Label htmlFor={`description-${question.id}`}>Description (optional)</Label>
          <Textarea
            id={`description-${question.id}`}
            value={question.description || ""}
            onChange={(e) => updateQuestion(question.id, { description: e.target.value })}
            placeholder="Add a description or instructions for this question"
            rows={2}
          />
        </div>
      </div>
    </div>
  )
}

export default function CreateSurveyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [surveyTitle, setSurveyTitle] = useState("")
  const [surveyDescription, setSurveyDescription] = useState("")
  const [questions, setQuestions] = useState([])
  const [debugInfo, setDebugInfo] = useState(null)
  const [showServiceKeyWarning, setShowServiceKeyWarning] = useState(false)

  const addQuestion = () => {
    const newQuestion = {
      id: Date.now().toString(),
      title: "",
      type: "text",
      required: false,
      isPublic: false,
      description: "",
      captureCurrentLocation: true,
      allowMapSelection: false,
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (id, updates) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)))
  }

  const removeQuestion = (id) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((q) => q.id === active.id)
        const newIndex = items.findIndex((q) => q.id === over.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // Check if user exists in the users table
  const checkUserExists = async (userId) => {
    try {
      const { data, error } = await supabase.from("users").select("id").eq("id", userId).single()

      return { exists: !!data, error }
    } catch (error) {
      console.error("Error checking user:", error)
      return { exists: false, error }
    }
  }

  // Create user record using direct API route
  const createUserRecord = async (userId, userData) => {
    try {
      const response = await fetch("/api/users/direct-create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          email: userData.email,
          name: userData.name,
          role: "data_collector",
        }),
      })

      const data = await response.json()
      return { success: data.success, error: data.error }
    } catch (error) {
      console.error("Error creating user via API:", error)
      return { success: false, error: error.message }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!surveyTitle.trim()) {
      toast({
        title: "Error",
        description: "Please provide a survey title",
        variant: "destructive",
      })
      return
    }

    if (questions.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one question",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setDebugInfo(null)
    setShowServiceKeyWarning(false)

    try {
      // Check if user is authenticated
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Session error:", sessionError)
        throw new Error(`Authentication error: ${sessionError.message}`)
      }

      if (!session) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to create a survey",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      // Collect debug info
      const debug = {
        userId: session.user.id,
        email: session.user.email,
        attempts: [],
      }

      // First, check if the user exists in the users table
      const { exists: userExists } = await checkUserExists(session.user.id)

      // If user doesn't exist, try to create it
      if (!userExists) {
        debug.attempts.push({ method: "api-route", started: new Date().toISOString() })

        // Try to create user via API route
        const { success, error } = await createUserRecord(session.user.id, {
          name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || "User",
          email: session.user.email,
        })

        debug.attempts[0].result = { success, error }
        debug.attempts[0].finished = new Date().toISOString()

        if (!success) {
          console.warn("Failed to create user record:", error)
          setDebugInfo(debug)

          // Show warning if service key is missing
          if (error && error.includes("Service role key not available")) {
            setShowServiceKeyWarning(true)
          }

          // We'll try to create the survey anyway, but it might fail due to FK constraint
        }
      }

      // Now create the survey
      console.log("Creating survey...")
      const { data, error } = await supabase
        .from("surveys")
        .insert({
          title: surveyTitle,
          description: surveyDescription,
          questions: questions,
          created_by: session.user.id,
          status: "pending", // All surveys start as pending until approved by admin
        })
        .select()

      if (error) {
        console.error("Survey creation error:", error)

        // If we get a foreign key constraint error, it means the user doesn't exist
        if (error.message?.includes("violates foreign key constraint")) {
          throw new Error("User record not found. Please contact your administrator.")
        }

        throw error
      }

      toast({
        title: "Success",
        description: "Survey created successfully and pending approval",
      })

      // Redirect to the dashboard surveys page
      router.push("/dashboard?tab=surveys")
    } catch (error) {
      console.error("Error creating survey:", error)

      // Handle specific error cases
      if (error.message?.includes("Unauthorized") || error.message?.includes("auth") || error.code === "PGRST301") {
        toast({
          title: "Authentication Error",
          description: "Your session may have expired. Please log in again.",
          variant: "destructive",
        })
        // Redirect to login
        setTimeout(() => router.push("/login"), 2000)
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to create survey. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Add authentication check when component loads
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to create a survey",
          variant: "destructive",
        })
        router.push("/login")
      }
    }

    checkAuth()
  }, [router, toast])

  return (
    <div className="container py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create New Survey</h1>

        {showServiceKeyWarning && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-amber-800 mb-1">Admin Configuration Required</h3>
              <p className="text-sm text-amber-700">
                The service role key is not configured. This may cause issues with user management. Please contact your
                administrator to set up the SUPABASE_KEY environment variable.
              </p>
            </div>
          </div>
        )}

        {debugInfo && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <h3 className="font-bold text-amber-800 mb-2">Debug Information</h3>
            <pre className="text-xs overflow-auto max-h-40 bg-white p-2 rounded border">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
            <p className="mt-2 text-sm text-amber-700">
              Please share this information with support to help diagnose the issue.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Survey Details</CardTitle>
              <CardDescription>Provide basic information about your survey</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Survey Title</Label>
                <Input
                  id="title"
                  value={surveyTitle}
                  onChange={(e) => setSurveyTitle(e.target.value)}
                  placeholder="Enter survey title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Survey Description</Label>
                <Textarea
                  id="description"
                  value={surveyDescription}
                  onChange={(e) => setSurveyDescription(e.target.value)}
                  placeholder="Enter survey description"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Survey Questions</h2>
              <Button type="button" onClick={addQuestion} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" /> Add Question
              </Button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
                {questions.map((question, index) => (
                  <QuestionItem
                    key={question.id}
                    question={question}
                    index={index}
                    updateQuestion={updateQuestion}
                    removeQuestion={removeQuestion}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {questions.length === 0 && (
              <div className="text-center p-8 border border-dashed rounded-lg">
                <p className="text-muted-foreground">No questions added yet. Click "Add Question" to get started.</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.push("/surveys")} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save Survey
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

