"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Calendar, MapPin, Save, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default function SurveyPage({ params }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [surveyData, setSurveyData] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [responses, setResponses] = useState({})
  const [location, setLocation] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch survey data
  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        setIsLoading(true)
        // This would be replaced with an actual API call
        // const response = await fetch(`/api/surveys/${params.id}`);
        // const data = await response.json();
        // setSurveyData(data);

        // For now, show a message that we're waiting for backend integration
        setTimeout(() => {
          setIsLoading(false)
        }, 1000)
      } catch (error) {
        console.error("Error fetching survey:", error)
        toast({
          title: "Error",
          description: "Failed to load survey. Please try again later.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    fetchSurvey()
  }, [params.id, toast])

  // If loading or no survey data
  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p>Loading survey...</p>
        </div>
      </div>
    )
  }

  if (!isLoading && !surveyData) {
    return (
      <div className="container py-10">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" className="mb-6" onClick={() => router.push("/surveys")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Surveys
          </Button>

          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Survey Not Available</CardTitle>
              <CardDescription>This survey is not available or is waiting for backend integration.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Please check back later or contact the administrator.</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => router.push("/surveys")}>Return to Surveys</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  // Mock survey data
  const surveyDataMock = {
    id: "1",
    title: "Donkey Health Assessment",
    description: "This survey collects information about the health and welfare of donkeys in your area.",
    questions: [
      {
        id: "q1",
        title: "How many donkeys do you own?",
        type: "number",
        required: true,
        isPublic: true,
      },
      {
        id: "q2",
        title: "What is the general health condition of your donkeys?",
        type: "select",
        options: ["Excellent", "Good", "Fair", "Poor"],
        required: true,
        isPublic: true,
      },
      {
        id: "q3",
        title: "What type of work do your donkeys primarily do?",
        type: "select",
        options: ["Transport goods", "Transport people", "Agricultural work", "Other"],
        required: true,
        isPublic: true,
      },
      {
        id: "q4",
        title: "How often do your donkeys have access to clean water?",
        type: "select",
        options: ["Multiple times daily", "Once daily", "Every few days", "Irregularly"],
        required: true,
        isPublic: false,
      },
      {
        id: "q5",
        title: "What type of feed do you provide to your donkeys?",
        type: "multiselect",
        options: ["Grass", "Hay", "Grain", "Commercial feed", "Kitchen scraps", "Other"],
        required: true,
        isPublic: false,
      },
      {
        id: "q6",
        title: "Have your donkeys received veterinary care in the past year?",
        type: "select",
        options: ["Yes", "No"],
        required: true,
        isPublic: true,
      },
      {
        id: "q7",
        title: "If yes, what type of veterinary care did they receive?",
        type: "multiselect",
        options: ["Vaccination", "Deworming", "Injury treatment", "Dental care", "Other"],
        required: false,
        isPublic: false,
      },
      {
        id: "q8",
        title: "Any additional comments about your donkeys' health or welfare?",
        type: "text",
        required: false,
        isPublic: false,
      },
      {
        id: "q9",
        title: "Current location",
        type: "location",
        required: true,
        isPublic: true,
      },
    ],
  }

  const currentSurveyData = surveyData || surveyDataMock

  // Get current question
  const currentQuestion = currentSurveyData.questions[currentStep]
  const progress = ((currentStep + 1) / currentSurveyData.questions.length) * 100

  // Handle response change
  const handleResponseChange = (questionId, value) => {
    setResponses({
      ...responses,
      [questionId]: value,
    })
  }

  // Handle checkbox change for multiselect
  const handleCheckboxChange = (questionId, option, checked) => {
    const currentValues = responses[questionId] || []
    let newValues

    if (checked) {
      newValues = [...currentValues, option]
    } else {
      newValues = currentValues.filter((value) => value !== option)
    }

    setResponses({
      ...responses,
      [questionId]: newValues,
    })
  }

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setLocation({ latitude, longitude })
          handleResponseChange(currentQuestion.id, { latitude, longitude })
          toast({
            title: "Location Captured",
            description: `Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(6)}`,
          })
        },
        (error) => {
          toast({
            title: "Error",
            description: `Failed to get location: ${error.message}`,
            variant: "destructive",
          })
        },
      )
    } else {
      toast({
        title: "Error",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive",
      })
    }
  }

  // Handle next question
  const handleNext = () => {
    // Validate current response
    if (currentQuestion.required && !responses[currentQuestion.id]) {
      toast({
        title: "Required Field",
        description: "Please answer this question before proceeding.",
        variant: "destructive",
      })
      return
    }

    if (currentStep < currentSurveyData.questions.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit()
    }
  }

  // Handle previous question
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Handle survey submission
  const handleSubmit = () => {
    // Check if all required questions are answered
    const unansweredRequired = currentSurveyData.questions.filter((q) => q.required && !responses[q.id])

    if (unansweredRequired.length > 0) {
      toast({
        title: "Incomplete Survey",
        description: `Please answer all required questions (${unansweredRequired.length} remaining).`,
        variant: "destructive",
      })
      return
    }

    // Redirect to the submit confirmation page
    router.push(`/surveys/${params.id}/submit`)
  }

  // Render question based on type
  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case "text":
        return (
          <Textarea
            id={currentQuestion.id}
            value={responses[currentQuestion.id] || ""}
            onChange={(e) => handleResponseChange(currentQuestion.id, e.target.value)}
            placeholder="Enter your answer"
            className="min-h-[100px]"
          />
        )
      case "number":
        return (
          <Input
            id={currentQuestion.id}
            type="number"
            value={responses[currentQuestion.id] || ""}
            onChange={(e) => handleResponseChange(currentQuestion.id, e.target.value)}
            placeholder="Enter a number"
          />
        )
      case "select":
        return (
          <RadioGroup
            value={responses[currentQuestion.id] || ""}
            onValueChange={(value) => handleResponseChange(currentQuestion.id, value)}
            className="space-y-2"
          >
            {currentQuestion.options.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${currentQuestion.id}-${option}`} />
                <Label htmlFor={`${currentQuestion.id}-${option}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        )
      case "multiselect":
        return (
          <div className="space-y-2">
            {currentQuestion.options.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${currentQuestion.id}-${option}`}
                  checked={(responses[currentQuestion.id] || []).includes(option)}
                  onCheckedChange={(checked) => handleCheckboxChange(currentQuestion.id, option, checked)}
                />
                <Label htmlFor={`${currentQuestion.id}-${option}`}>{option}</Label>
              </div>
            ))}
          </div>
        )
      case "date":
        return (
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id={currentQuestion.id}
              type="date"
              value={responses[currentQuestion.id] || ""}
              onChange={(e) => handleResponseChange(currentQuestion.id, e.target.value)}
              className="pl-10"
            />
          </div>
        )
      case "location":
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Button type="button" onClick={getCurrentLocation} className="gap-2">
                <MapPin className="h-4 w-4" />
                Capture Current Location
              </Button>
            </div>
            {location && (
              <div className="p-3 bg-muted rounded-md text-sm">
                <p>Latitude: {location.latitude.toFixed(6)}</p>
                <p>Longitude: {location.longitude.toFixed(6)}</p>
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="container py-10">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" className="mb-6" onClick={() => router.push("/surveys")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Surveys
        </Button>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle>{currentSurveyData.title}</CardTitle>
            <CardDescription>{currentSurveyData.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  Question {currentStep + 1} of {currentSurveyData.questions.length}
                </span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">
                  {currentQuestion.title}
                  {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
                </h3>
                {currentQuestion.isPublic && (
                  <p className="text-xs text-muted-foreground">This information will be publicly visible on the map</p>
                )}
              </div>
              {renderQuestion()}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
              Previous
            </Button>
            <Button onClick={handleNext} disabled={isSubmitting}>
              {isSubmitting ? (
                "Submitting..."
              ) : currentStep === currentSurveyData.questions.length - 1 ? (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Submit
                </>
              ) : (
                "Next"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

