import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@oppskills/db';
import type { CreateTeamDto } from '@oppskills/types';

@Injectable()
export class TeamService {
  /**
   * Create a team for a hackathon.
   * - Verifies hackathon exists and is open for registration.
   * - Enforces maxTeams limit if configured on the hackathon.
   * - Hackathon owner cannot create a team in their own hackathon.
   */
  async createTeam(dto: CreateTeamDto, leaderId: string) {
    // Verify hackathon exists and get maxTeams setting
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { id: dto.hackathonId },
      select: {
        id: true,
        ownerId: true,
        maxTeams: true,
        _count: {
          select: {
            teams: true,
          },
        },
      },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    // Hackathon owner cannot create a team in their own hackathon
    if (hackathon.ownerId === leaderId) {
      throw new ForbiddenException(
        'Hackathon owner cannot create a team in their own hackathon',
      );
    }

    // Enforce maxTeams limit if configured (null = unlimited)
    if (hackathon.maxTeams !== null) {
      const currentTeamCount = hackathon._count.teams;
      if (currentTeamCount >= hackathon.maxTeams) {
        throw new ForbiddenException(
          `Maximum number of teams (${hackathon.maxTeams}) has been reached for this hackathon.`,
        );
      }
    }

    const team = await prisma.teamEntity.create({
      data: {
        name: dto.name,
        maxSize: dto.maxSize,
        hackathonId: dto.hackathonId,
        leaderId,
      },
      include: {
        leader: true,
        hackathon: true,
      },
    });

    return team;
  }

  async getTeamsByHackathon(hackathonId: string) {
    return prisma.teamEntity.findMany({
      where: { hackathonId },
      include: {
        leader: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });
  }

  async getTeamById(teamId: string) {
    const team = await prisma.teamEntity.findUnique({
      where: { id: teamId },
      include: {
        hackathon: true,
        leader: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  async joinTeam(dto: CreateTeamDto, userId: string) {
    const team = await prisma.teamEntity.findUnique({
      where: { id: dto.teamId },
      include: { members: true },
    });
    if (!team) throw new NotFoundException('Team not found');

    if (team.members.length >= team.maxSize)
      throw new ForbiddenException('Team is already full');

    if (team.leaderId === userId)
      throw new ForbiddenException('Team leader cannot join their own team');

    // Prevent joining twice
    const alreadyMember = team.members.some((m) => m.userId === userId);
    if (alreadyMember)
      throw new ForbiddenException('User already part of this team');

    const newMember = await prisma.teamMemberEntity.create({
      data: { userId, teamId: team.id },
    });

    return newMember;
  }

  async leaveTeam(teamId: string, userId: string) {
    const member = await prisma.teamMemberEntity.findFirst({
      where: { teamId, userId },
    });

    if (!member) throw new NotFoundException('Not part of this team');

    await prisma.teamMemberEntity.delete({ where: { id: member.id } });

    return { message: 'Left team successfully' };
  }
}
