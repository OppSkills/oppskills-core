"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface JoinTeamListProps {
  hackathonId: string
}

const MOCK_TEAMS = [
  { id: "1", name: "Code Warriors", leader: "Alice", members: 3, maxSize: 4 },
  { id: "2", name: "Design Gurus", leader: "Bob", members: 2, maxSize: 4 },
  { id: "3", name: "Full Stack Heroes", leader: "Charlie", members: 4, maxSize: 4 },
]

export function JoinTeamList({ hackathonId }: JoinTeamListProps) {
  const [joiningId, setJoiningId] = useState<string | null>(null)

  const handleJoin = async (teamId: string) => {
    setJoiningId(teamId)
    // Simulate API
    await new Promise(resolve => setTimeout(resolve, 1000))
    setJoiningId(null)

    console.log("Joined team:", teamId, "Hackathon:", hackathonId)
    toast.success("Request to join sent! (Mock)")
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Available Teams</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOCK_TEAMS.map((team) => (
          <Card key={team.id}>
            <CardHeader>
              <CardTitle className="text-lg">{team.name}</CardTitle>
              <p className="text-sm text-muted-foreground">Leader: {team.leader}</p>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <Badge variant="secondary">
                  Members: {team.members} / {team.maxSize}
                </Badge>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handleJoin(team.id)}
                disabled={!!joiningId || team.members >= team.maxSize}
              >
                {joiningId === team.id && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {team.members >= team.maxSize ? "Full" : "Join Team"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}