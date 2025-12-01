import { useQuery } from '@tanstack/react-query';
import { useAuth } from "@clerk/nextjs";
import { getHackathonById } from '@/lib/api/hackathonApi'; 

export const useHackathonById = (id: string | null | undefined) => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["hackathon", id],
    queryFn: async () => {
      const token = await getToken();
      return getHackathonById(token!, id!);
    },
    enabled: !!id, // Only run if ID exists
  });
};