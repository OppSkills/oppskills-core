import { 
  createHackathon, 
  deleteHackathon, 
  getHackathons, 
  registerForHackathon, 
  updateHackathon 
} from '@/lib/api/hackathonApi';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from "@clerk/nextjs";


export const useHackathons = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  // ▌GET HACKATHONS
  const { data, isLoading, error } = useQuery({
    queryKey: ['hackathons'],
    queryFn: async () => {
      const token = await getToken();
      return getHackathons(token!);
    },
  });

  // ▌CREATE
  const create = useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken();
      return createHackathon(token!, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hackathons'] }),
  });

  // ▌UPDATE
  const update = useMutation({
    mutationFn: async ({ id, data }: any) => {
      const token = await getToken();
      return updateHackathon(token!, id, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hackathons'] }),
  });

  // ▌DELETE
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return deleteHackathon(token!, id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hackathons'] }),
  });

  // ▌REGISTER
  const register = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return registerForHackathon(token!, id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hackathons'] }),
  });

  return { data, isLoading, error, create, update, remove, register };
};
