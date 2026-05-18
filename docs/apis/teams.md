# Teams API

API reference for endpoints related to hackathon team management, including creation, joining, leaving, and team leadership.

## Overview

Teams are specific to Hackathons. A user can either participate solo (a team of 1) or join a multi-member team, depending on the hackathon's configuration (e.g., `minTeamSize`, `maxTeamSize`).

**Base URL prefix**: `/hackathons`

---

## 1. Team Creation and Joining

### Create a Team (`POST /hackathons/create-team`)
**Method**: `POST`
**Description**: Creates a new team for a specific hackathon and makes the creator the team leader.

**Sample Request Body**:
```json
{
  "hackathonId": "hack_123",
  "teamName": "Byte Busters"
}
```

### Join a Team (`POST /hackathons/join-team`)
**Method**: `POST`
**Description**: Joins an existing team. This might require an invite code or open participation depending on the team's settings.

**Sample Request Body**:
```json
{
  "teamId": "team_abc123",
  "inviteCode": "XYZ789"
}
```

---

## 2. Team Queries

### Get My Team (`GET /hackathons/my-team`)
**Method**: `GET`
**Description**: Retrieves the team(s) the currently authenticated user belongs to. Often combined with a query parameter for a specific hackathon.

### Get Team by ID (`GET /hackathons/team/:teamId`)
**Method**: `GET`
**Description**: Retrieves details of a specific team, including its members, leader, and status.

### Get All Teams for a Hackathon (`GET /hackathons/teams/:hackathonId`)
**Method**: `GET`
**Description**: Retrieves all registered teams for a given hackathon. Used primarily for leaderboards, discovery, or organizer views.

---

## 3. Team Management

### Leave a Team (`DELETE /hackathons/leave-team/:teamId`)
**Method**: `DELETE`
**Description**: Allows the current user to leave their team. If the user is the leader, they may need to reassign leadership first, or the team is dissolved if they are the only member.

### Remove a Member (`DELETE /hackathons/leave-team/:teamId/member/:userId`)
**Method**: `DELETE`
**Description**: Allows a team leader or organizer to remove a specific member from the team.

### Change Team Leader (`PATCH /hackathons/team/:teamId/leader`)
**Method**: `PATCH`
**Description**: Promotes another team member to be the team leader. Can only be performed by the current leader or an organizer.

**Sample Request Body**:
```json
{
  "newLeaderId": "user_456"
}
```

---

## 4. Draft Teams (Checkout Process)

Used during the registration checkout flow to create temporary team structures before payment is completed.
- **Create Draft Team**: `POST /hackathons/:slug/teams/draft`
- **Join Draft Team**: `POST /hackathons/:slug/teams/draft/join`
- **Check Fee Status**: `GET /hackathons/:slug/teams/draft/per-user-fee-status`
- **Leave Draft Team**: `DELETE /hackathons/:slug/teams/draft/leave`
