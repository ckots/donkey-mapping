"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Badge } from "@/components/ui/button"
import { CheckCircle, Clock, FileText, MapPin, Plus, Star, XCircle } from "lucide-react"
import { WelcomeBanner } from "@/components/welcome-banner"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { createUserIfNotExists } from "@/lib/create-user"

export default function DashboardPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [mySurveys, setMySurveys] = useState([])
  const [surveysByRegion, setSurveysByRegion] = useState([])
  const [donkeyHealthData, setDonkeyHealthData] = useState([])
  const [surveyCompletionData, setSurveyCompletionData] = useState([])
  const [userStats, setUserStats] = useState({
    totalSurveys: 0,
    donkeysMapped: 0,
    points: 0,
    ranking: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          toast({
            title: "Authentication Required",
            description: "Please log in to view your dashboard",
            variant: "destructive",
          })
          router.push("/login")
          return
        }

        // Ensure user record exists - with better error handling
        try {
          const { success, error } = await createUserIfNotExists()
          if (!success && error) {
            console.warn("Note: Failed to ensure user exists:", error)
            // Continue anyway - the user might already exist
          }
        } catch (userError) {
          console.error("Error in user creation:", userError)
          // Continue anyway - we'll try to fetch data regardless
        }

        // Fetch user's surveys
        const fetchUserData = async () => {
          try {
            setIsLoading(true)

            // Fetch user's surveys
            const { data: surveysData, error: surveysError } = await supabase
              .from("surveys")
              .select("*")
              .eq("created_by", session.user.id)
              .order("created_at", { ascending: false })

            if (surveysError) throw surveysError

            setMySurveys(surveysData || [])

            // Set user stats - in production, these would come from the database
            setUserStats({
              totalSurveys: surveysData?.length || 0,
              donkeysMapped: 0,
              points: 0,
              ranking: 0,
            })
          } catch (error) {
            console.error("Error fetching dashboard data:", error)
            toast({
              title: "Error",
              description: "Failed to load dashboard data. Please try again later.",
              variant: "destructive",
            })
          } finally {
            setIsLoading(false)
          }
        }

        fetchUserData()
      } catch (error) {
        console.error("Error in checkAuth:", error)
        toast({
          title: "Authentication Error",
          description: "There was a problem verifying your session. Please try logging in again.",
          variant: "destructive",
        })
        router.push("/login")
      }
    }

    checkAuth()
  }, [router, toast])

  return (
    <div className="container py-10">
      {/* Add the welcome banner at the top of the dashboard */}
      <WelcomeBanner />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's an overview of your survey activities.</p>
        </div>
        <Link href="/surveys/create">
          <Button className="bg-[#1A4314] hover:bg-[#1A4314]/90">
            <Plus className="mr-2 h-4 w-4" /> Create New Survey
          </Button>
        </Link>
      </div>

      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-grid">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="surveys">My Surveys</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Surveys</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.totalSurveys}</div>
                <p className="text-xs text-muted-foreground">Your created surveys</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Donkeys Mapped</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.donkeysMapped}</div>
                <p className="text-xs text-muted-foreground">Donkeys recorded in your surveys</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Points Earned</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.points}</div>
                <p className="text-xs text-muted-foreground">Reward points earned</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ranking</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">#{userStats.ranking || "-"}</div>
                <p className="text-xs text-muted-foreground">Your position among data collectors</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Surveys */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Surveys</CardTitle>
              <CardDescription>Your most recent survey submissions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A4314] mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading your surveys...</p>
                </div>
              ) : mySurveys.length > 0 ? (
                <div className="space-y-4">
                  {mySurveys.slice(0, 3).map((survey) => (
                    <div
                      key={survey.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{survey.title}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span>{new Date(survey.created_at).toLocaleDateString()}</span>
                          <span className="mx-2">•</span>
                          <Badge
                            variant={
                              survey.status === "approved"
                                ? "default"
                                : survey.status === "pending"
                                  ? "outline"
                                  : "destructive"
                            }
                            className="text-xs"
                          >
                            {survey.status.charAt(0).toUpperCase() + survey.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      <Link href={`/surveys/${survey.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">You haven't created any surveys yet.</p>
                  <Link href="/surveys/create" className="mt-4 inline-block">
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" /> Create Your First Survey
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
            {mySurveys.length > 0 && (
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setActiveTab("surveys")}>
                  View All Surveys
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Chart - Only show if there's data */}
          {surveyCompletionData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Survey Completion</CardTitle>
                <CardDescription>Number of surveys completed over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ChartContainer
                    config={{
                      completed: {
                        label: "Completed Surveys",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={surveyCompletionData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="completed" fill="var(--color-completed)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="surveys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Surveys</CardTitle>
              <CardDescription>Manage your created surveys and view their status</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A4314] mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading your surveys...</p>
                </div>
              ) : mySurveys.length > 0 ? (
                <div className="space-y-4">
                  {mySurveys.map((survey) => (
                    <div
                      key={survey.id}
                      className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 last:border-0 last:pb-0 gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{survey.title}</p>
                          {survey.status === "approved" ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : survey.status === "pending" ? (
                            <Clock className="h-4 w-4 text-amber-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span>Created: {new Date(survey.created_at).toLocaleDateString()}</span>
                          <span className="mx-2">•</span>
                          <span>Responses: {survey.responses_count || 0}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end md:self-auto">
                        <Badge
                          variant={
                            survey.status === "approved"
                              ? "default"
                              : survey.status === "pending"
                                ? "outline"
                                : "destructive"
                          }
                          className="text-xs"
                        >
                          {survey.status.charAt(0).toUpperCase() + survey.status.slice(1)}
                        </Badge>
                        <Link href={`/surveys/${survey.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                        {survey.status === "approved" && (
                          <Link href={`/surveys/${survey.id}/results`}>
                            <Button variant="default" size="sm">
                              Results
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">You haven't created any surveys yet.</p>
                  <Link href="/surveys/create" className="mt-4 inline-block">
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" /> Create Your First Survey
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Link href="/surveys/create" className="w-full">
                <Button className="w-full">
                  <Plus className="mr-2 h-4 w-4" /> Create New Survey
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>Your survey analytics will appear here once you have collected data</CardDescription>
            </CardHeader>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">
                Start creating surveys and collecting responses to see analytics here.
              </p>
              <Link href="/surveys/create" className="mt-4 inline-block">
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Create a Survey
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

