"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, Clock, Search, Trash, UserCheck, UserX, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Replace the mock data arrays with empty arrays
// const pendingSurveys = []
// const pendingUsers = []
// const allUsers = []

export default function AdminPage() {
  const { toast } = useToast()

  // Add these state variables at the top of the component:
  const [pendingSurveys, setPendingSurveys] = useState([])
  const [pendingUsers, setPendingUsers] = useState([])
  const [allUsers, setAllUsers] = useState([])

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSurvey, setSelectedSurvey] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showSurveyDialog, setShowSurveyDialog] = useState(false)
  const [showUserDialog, setShowUserDialog] = useState(false)

  // Add useEffect to fetch data from an API
  useEffect(() => {
    // This would be replaced with actual API calls
    // Example:
    // const fetchAdminData = async () => {
    //   try {
    //     const pendingSurveysResponse = await fetch('/api/admin/pending-surveys');
    //     const pendingSurveysData = await pendingSurveysResponse.json();
    //     setPendingSurveys(pendingSurveysData);
    //
    //     const pendingUsersResponse = await fetch('/api/admin/pending-users');
    //     const pendingUsersData = await pendingUsersResponse.json();
    //     setPendingUsers(pendingUsersData);
    //
    //     const allUsersResponse = await fetch('/api/admin/users');
    //     const allUsersData = await allUsersResponse.json();
    //     setAllUsers(allUsersData);
    //   } catch (error) {
    //     console.error("Error fetching admin data:", error);
    //     toast({
    //       title: "Error",
    //       description: "Failed to load admin data. Please try again later.",
    //       variant: "destructive",
    //     });
    //   }
    // };
    //
    // fetchAdminData();
  }, [])

  const handleApproveSurvey = (id) => {
    toast({
      title: "Survey Approved",
      description: "The survey has been approved and is now public.",
    })
    setShowSurveyDialog(false)
  }

  const handleRejectSurvey = (id) => {
    toast({
      title: "Survey Rejected",
      description: "The survey has been rejected.",
    })
    setShowSurveyDialog(false)
  }

  const handleApproveUser = (id) => {
    toast({
      title: "User Approved",
      description: "The user account has been activated.",
    })
    setShowUserDialog(false)
  }

  const handleRejectUser = (id) => {
    toast({
      title: "User Rejected",
      description: "The user account has been rejected.",
    })
    setShowUserDialog(false)
  }

  const filteredUsers = allUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <Tabs defaultValue="approvals" className="space-y-8">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-grid">
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="space-y-8">
          {/* Pending Surveys */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Surveys</CardTitle>
              <CardDescription>Review and approve surveys submitted by data collectors</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingSurveys.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No pending surveys to review</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Creator</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingSurveys.map((survey) => (
                      <TableRow key={survey.id}>
                        <TableCell className="font-medium">{survey.title}</TableCell>
                        <TableCell>{survey.creator}</TableCell>
                        <TableCell>{new Date(survey.date).toLocaleDateString()}</TableCell>
                        <TableCell>{survey.questions}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSurvey(survey)
                              setShowSurveyDialog(true)
                            }}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Pending Users */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Users</CardTitle>
              <CardDescription>Review and approve user registration requests</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingUsers.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No pending user requests</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>{new Date(user.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setShowUserDialog(true)
                            }}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search users..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Manage all users and their permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        {user.status ? (
                          <Badge
                            variant={
                              user.status === "approved"
                                ? "default"
                                : user.status === "rejected"
                                  ? "destructive"
                                  : "outline"
                            }
                          >
                            {user.status === "approved" ? (
                              <CheckCircle className="mr-1 h-3 w-3" />
                            ) : user.status === "rejected" ? (
                              <XCircle className="mr-1 h-3 w-3" />
                            ) : (
                              <Clock className="mr-1 h-3 w-3" />
                            )}
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <Clock className="mr-1 h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-100"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Survey Review Dialog */}
      <Dialog open={showSurveyDialog} onOpenChange={setShowSurveyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review Survey</DialogTitle>
            <DialogDescription>Review the survey details before approving or rejecting</DialogDescription>
          </DialogHeader>
          {selectedSurvey && (
            <div className="space-y-4 py-4">
              <div>
                <h3 className="font-medium">Title</h3>
                <p>{selectedSurvey.title}</p>
              </div>
              <div>
                <h3 className="font-medium">Creator</h3>
                <p>{selectedSurvey.creator}</p>
              </div>
              <div>
                <h3 className="font-medium">Submission Date</h3>
                <p>{new Date(selectedSurvey.date).toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="font-medium">Number of Questions</h3>
                <p>{selectedSurvey.questions}</p>
              </div>
            </div>
          )}
          <DialogFooter className="flex space-x-2 sm:space-x-0">
            <Button variant="outline" onClick={() => setShowSurveyDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => handleRejectSurvey(selectedSurvey?.id)}>
              Reject
            </Button>
            <Button onClick={() => handleApproveSurvey(selectedSurvey?.id)}>Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Review Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review User</DialogTitle>
            <DialogDescription>Review the user details before approving or rejecting</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div>
                <h3 className="font-medium">Name</h3>
                <p>{selectedUser.name}</p>
              </div>
              <div>
                <h3 className="font-medium">Email</h3>
                <p>{selectedUser.email}</p>
              </div>
              <div>
                <h3 className="font-medium">Requested Role</h3>
                <p>{selectedUser.role}</p>
              </div>
              <div>
                <h3 className="font-medium">Registration Date</h3>
                <p>{new Date(selectedUser.date).toLocaleDateString()}</p>
              </div>
            </div>
          )}
          <DialogFooter className="flex space-x-2 sm:space-x-0">
            <Button variant="outline" onClick={() => setShowUserDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => handleRejectUser(selectedUser?.id)}>
              <UserX className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button onClick={() => handleApproveUser(selectedUser?.id)}>
              <UserCheck className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

