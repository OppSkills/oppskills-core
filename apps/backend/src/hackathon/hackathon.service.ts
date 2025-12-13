import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { prisma } from '@oppskills/db';
import type { CreateHackathonDto } from '@oppskills/types';

@Injectable()
export class HackathonService {
  async createHackathon(dto: CreateHackathonDto, userId: string) {
    try {
      const hackathon = await prisma.hackathonEntity.create({
        data: {
          title: dto.title,
          description: dto.description,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          mode: dto.mode,
          ownerId: userId,
        },
      });
 
      return hackathon;
    } catch (error) {
      throw new ForbiddenException('Error creating hackathon: ' + error.message);
    }
  }

  async getAllHackathons() {
    return prisma.hackathonEntity.findMany({
      include: {
        owner: {
          select: { id: true, email: true, firstName: true, lastName: true, imageUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateHackathon(id: string, dto: CreateHackathonDto, userId: string) {
  const hackathon = await prisma.hackathonEntity.findUnique({where: {id}});
  if (!hackathon) throw new NotFoundException('Hackathon not found');

  if(hackathon.ownerId !== userId)
    throw new ForbiddenException('You are not the owner of this Hacakathon');

  return prisma.hackathonEntity.update({
    where: { id },
    data: {
      title: dto.title,
      description: dto.description,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      mode: dto.mode,
    }
  });
  }

  async deleteHackathon(id: string, userId:string){
    const hackathon = await prisma.hackathonEntity.findUnique({where: {id}});
    if (!hackathon) throw new NotFoundException("hackathon not found");

    if(hackathon.ownerId !== userId)
      throw new ForbiddenException('You are not the owner of this hackathon');

    await prisma.hackathonEntity.delete(
      { where: {id}}
    );

    return {message: 'Hackathon deleted Successfully'};
  }

  async registerForHackathon(hackathonId: string, userId: string){
    const hackathon = await prisma.hackathonEntity.findUnique({where: {id: hackathonId}});
    if (!hackathon) throw new NotFoundException('hackathon not found');

    if(hackathon.ownerId === userId)
      throw new ForbiddenException ("You cannot register for your own hackathon");

    return{
      message: "User registered successfully for Hackathon"
    }
  }
}
