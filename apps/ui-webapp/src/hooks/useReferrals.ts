"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createReferral,
  deleteReferral,
  getReferralAnalytics,
  getReferralById,
  getReferralRegistrations,
  listReferrals,
  lookupReferrerUser,
  getReferrerDetails,
  type ReferralEntityType,
  type ReferralListItem,
  type ReferralAnalytics,
  type ReferredUser,
} from "@/lib/api/referralApi";

async function tokenOrThrow(getToken: () => Promise<string | null>) {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");
  return token;
}

const initialReferrersMock: ReferralListItem[] = [
  {
    id: "ref_1",
    code: "COMM-KARAN-402",
    clicksCount: 1420,
    registrationsCount: 89,
    clicksRecent: 15,
    registrationsRecent: 3,
    referrer: {
      id: "u_1",
      email: "karan.malhotra@brightwave.io",
      firstName: "Karan",
      lastName: "Malhotra",
      imageUrl: null,
      institution: "BrightWave Inc.",
      location: "Mumbai, India",
      profession: "Software Engineer",
      registrationDate: "12 Apr 2026",
    }
  },
  {
    id: "ref_2",
    code: "COMM-NEHA-109",
    clicksCount: 980,
    registrationsCount: 62,
    clicksRecent: 8,
    registrationsRecent: 2,
    referrer: {
      id: "u_2",
      email: "neha.kapoor@brightwave.io",
      firstName: "Neha",
      lastName: "Kapoor",
      imageUrl: null,
      institution: "Delhi University",
      location: "Delhi, India",
      profession: "Student",
      registrationDate: "15 Apr 2026",
    }
  },
  {
    id: "ref_3",
    code: "COMM-SUHANI-803",
    clicksCount: 740,
    registrationsCount: 38,
    clicksRecent: 4,
    registrationsRecent: 1,
    referrer: {
      id: "u_3",
      email: "suhani.mehta@brightwave.io",
      firstName: "Suhani",
      lastName: "Mehta",
      imageUrl: null,
      institution: "IIT Bombay",
      location: "Mumbai, India",
      profession: "Student",
      registrationDate: "22 Apr 2026",
    }
  },
  {
    id: "ref_4",
    code: "COMM-ANANYA-201",
    clicksCount: 530,
    registrationsCount: 29,
    clicksRecent: 2,
    registrationsRecent: 0,
    referrer: {
      id: "u_4",
      email: "ananya.sharma@brightwave.io",
      firstName: "Ananya",
      lastName: "Sharma",
      imageUrl: null,
      institution: "BITS Pilani",
      location: "Pilani, India",
      profession: "Student",
      registrationDate: "01 May 2026",
    }
  }
];

const mockReferredUsers: Record<string, ReferredUser[]> = {
  "ref_1": [
    {
      id: "ref_user_1",
      name: "Aarav Mehta",
      email: "aarav.mehta@gmail.com",
      avatarUrl: null,
      registrationDate: "14 Apr 2026",
      institution: "IIT Delhi",
      location: "Delhi, India",
      profession: "Student"
    },
    {
      id: "ref_user_2",
      name: "Riya Sen",
      email: "riya.sen@yahoo.com",
      avatarUrl: null,
      registrationDate: "15 Apr 2026",
      institution: "Mumbai University",
      location: "Mumbai, India",
      profession: "Student"
    }
  ],
  "ref_2": [
    {
      id: "ref_user_3",
      name: "Dev Patel",
      email: "dev.patel@gmail.com",
      avatarUrl: null,
      registrationDate: "18 Apr 2026",
      institution: "Gujarat University",
      location: "Ahmedabad, India",
      profession: "Student"
    }
  ]
};

export function useReferrals(entityType: ReferralEntityType, entityId: string) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["referrals", entityType, entityId],
    enabled: Boolean(entityId),
    queryFn: async () => {
      if (entityType === "COMMUNITY") {
        if (typeof window === "undefined") {
          return { data: initialReferrersMock, total: initialReferrersMock.length, page: 1, pageSize: 20 };
        }
        const key = `oppskills_community_referrals_${entityId}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          return JSON.parse(stored) as { data: ReferralListItem[]; total: number; page: number; pageSize: number };
        }
        const defaultData = {
          data: initialReferrersMock,
          total: initialReferrersMock.length,
          page: 1,
          pageSize: 20
        };
        localStorage.setItem(key, JSON.stringify(defaultData));
        return defaultData;
      }
      return listReferrals(await tokenOrThrow(getToken), { entityType, entityId });
    },
  });
}

export function useReferralAnalytics(
  entityType: ReferralEntityType,
  entityId: string,
) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["referral-analytics", entityType, entityId],
    enabled: Boolean(entityId),
    queryFn: async () => {
      if (entityType === "COMMUNITY") {
        if (typeof window === "undefined") {
          return {
            totalClicks: 3670,
            humanClicks: 3670,
            referredParticipants: 218,
            totalRegistrations: 218,
            activeReferrers: 4,
            totalReferrers: 4,
            linksGenerated: 4,
          };
        }
        const referralsKey = `oppskills_community_referrals_${entityId}`;
        const stored = localStorage.getItem(referralsKey);
        const referrers = stored ? (JSON.parse(stored) as { data: ReferralListItem[] }).data : initialReferrersMock;
        
        const totalClicks = referrers.reduce((acc: number, curr: any) => acc + curr.clicksCount, 0);
        const totalRegistrations = referrers.reduce((acc: number, curr: any) => acc + curr.registrationsCount, 0);
        
        return {
          totalClicks,
          humanClicks: totalClicks,
          referredParticipants: totalRegistrations,
          totalRegistrations,
          activeReferrers: referrers.filter((r: any) => r.clicksCount > 0).length,
          totalReferrers: referrers.length,
          linksGenerated: referrers.length,
        };
      }
      return getReferralAnalytics(await tokenOrThrow(getToken), {
        entityType,
        entityId,
      });
    },
  });
}

export function useCreateReferral(
  entityType: ReferralEntityType,
  entityId: string,
) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      referrerEmail: string;
      sendEmail?: boolean;
    }) => {
      if (entityType === "COMMUNITY") {
        if (typeof window === "undefined") return null;
        const referralsKey = `oppskills_community_referrals_${entityId}`;
        const stored = localStorage.getItem(referralsKey);
        const currentData = stored ? JSON.parse(stored) as { data: ReferralListItem[]; total: number; page: number; pageSize: number } : { data: initialReferrersMock, total: initialReferrersMock.length, page: 1, pageSize: 20 };
        
        // Check if duplicate
        if (currentData.data.some((r: any) => r.referrer.email.toLowerCase() === payload.referrerEmail.toLowerCase())) {
          throw new Error("Already a Referrer");
        }

        const usernamePart = payload.referrerEmail.split("@")[0];
        const firstName = usernamePart.charAt(0).toUpperCase() + usernamePart.slice(1);

        const newReferral = {
          id: `ref_${Date.now()}`,
          code: `COMM-${usernamePart.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
          clicksCount: 0,
          registrationsCount: 0,
          clicksRecent: 0,
          registrationsRecent: 0,
          referrer: {
            id: `u_${Date.now()}`,
            email: payload.referrerEmail,
            firstName,
            lastName: "",
            imageUrl: null,
            institution: "OppSkills Member",
            location: "India",
            profession: "Student",
            registrationDate: new Date().toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric"
            })
          }
        };

        const updatedData = {
          data: [newReferral, ...currentData.data],
          total: currentData.total + 1,
          page: 1,
          pageSize: 20
        };

        localStorage.setItem(referralsKey, JSON.stringify(updatedData));
        return newReferral;
      }
      return createReferral(await tokenOrThrow(getToken), {
        ...payload,
        entityType,
        entityId,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["referrals", entityType, entityId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["referral-analytics", entityType, entityId],
        }),
      ]);
    },
  });
}

export function useDeleteReferral(
  entityType: ReferralEntityType,
  entityId: string,
) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (entityType === "COMMUNITY") {
        if (typeof window === "undefined") return { success: true };
        const referralsKey = `oppskills_community_referrals_${entityId}`;
        const stored = localStorage.getItem(referralsKey);
        if (stored) {
          const currentData = JSON.parse(stored) as { data: ReferralListItem[]; total: number; page: number; pageSize: number };
          const filtered = currentData.data.filter((r: any) => r.id !== id);
          const updatedData = {
            data: filtered,
            total: filtered.length,
            page: 1,
            pageSize: 20
          };
          localStorage.setItem(referralsKey, JSON.stringify(updatedData));
        }
        return { success: true };
      }
      return deleteReferral(await tokenOrThrow(getToken), id);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["referrals", entityType, entityId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["referral-analytics", entityType, entityId],
        }),
      ]);
    },
  });
}

export function useReferrerLookup(
  entityType: ReferralEntityType,
  entityId: string,
  email: string,
  enabled: boolean,
) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["referrer-lookup", entityType, entityId, email],
    enabled: enabled && email.length > 0,
    retry: false,
    staleTime: 60_000,
    queryFn: async () => {
      if (entityType === "COMMUNITY") {
        const usernamePart = email.split("@")[0];
        const firstName = usernamePart.charAt(0).toUpperCase() + usernamePart.slice(1);
        return {
          id: `u_${usernamePart}`,
          email,
          firstName,
          lastName: "Member",
          imageUrl: null,
        };
      }
      return lookupReferrerUser(await tokenOrThrow(getToken), {
        entityType,
        entityId,
        email,
      });
    },
  });
}

export function useReferralRegistrations(
  referralId: string | null,
  page = 1,
  pageSize = 10,
) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["referral-registrations", referralId, page, pageSize],
    enabled: Boolean(referralId),
    queryFn: async () => {
      if (referralId && (referralId.startsWith("ref_") || referralId.startsWith("COMM-"))) {
        const key = referralId.startsWith("ref_") ? referralId : "ref_1";
        const users = mockReferredUsers[key] || [
          {
            id: "ref_user_default",
            name: "Ishaan Sharma",
            email: "ishaan@gmail.com",
            avatarUrl: null,
            registrationDate: new Date().toLocaleDateString("en-GB"),
            institution: "OppSkills Member",
            location: "Delhi, India",
            profession: "Student"
          }
        ];
        return {
          data: users,
          total: users.length,
          page: 1,
          pageSize: 10
        };
      }
      return getReferralRegistrations(
        await tokenOrThrow(getToken),
        referralId!,
        page,
        pageSize,
      );
    },
  });
}

export function useReferralById(referralId: string) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["referral", referralId],
    enabled: Boolean(referralId),
    queryFn: async () =>
      getReferralById(await tokenOrThrow(getToken), referralId),
  });
}

export function useReferrerDetailsForOrganizer(referralId: string | null) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["referrer-details", referralId],
    enabled: Boolean(referralId),
    queryFn: async () => {
      if (referralId && (referralId.startsWith("ref_") || referralId.startsWith("COMM-"))) {
        if (typeof window === "undefined") {
          return {
            referrer: {
              id: "u_1",
              name: "Karan Malhotra",
              email: "karan.malhotra@brightwave.io",
              avatarUrl: null,
              institution: "BrightWave Inc.",
              location: "Mumbai, India",
              profession: "Software Engineer",
              registrationDate: "12 Apr 2026",
            },
            opportunities: [
              {
                id: referralId,
                entityType: "COMMUNITY" as const,
                entityId: "community_1",
                entityName: "OppSkills Community",
                slug: "oppskills-community",
                image: null,
                dashboardUrl: "/dashboard",
                clicks: 1420,
                clicksLast24h: 15,
                registrations: 89,
                registrationsLast24h: 3,
                isActive: true,
              }
            ],
            summary: {
              totalReferrals: 1,
              totalClicks: 1420,
              clicksLast24h: 15,
              totalRegistrations: 89,
              registrationsLast24h: 3,
              activeLinks: 1,
            }
          };
        }

        let foundReferrer = initialReferrersMock.find(r => r.id === referralId);
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("oppskills_community_referrals_")) {
            const data = JSON.parse(localStorage.getItem(key) || "{}") as { data?: ReferralListItem[] };
            const match = data.data?.find((r) => r.id === referralId);
            if (match) {
              foundReferrer = match;
              break;
            }
          }
        }

        const referrer = foundReferrer ? {
          id: foundReferrer.referrer.id,
          name: `${foundReferrer.referrer.firstName} ${foundReferrer.referrer.lastName}`.trim(),
          email: foundReferrer.referrer.email,
          avatarUrl: foundReferrer.referrer.imageUrl || null,
          institution: foundReferrer.referrer.institution || "OppSkills Member",
          location: foundReferrer.referrer.location || "India",
          profession: foundReferrer.referrer.profession || "Student",
          registrationDate: foundReferrer.referrer.registrationDate || "Recent",
        } : {
          id: "u_1",
          name: "Karan Malhotra",
          email: "karan.malhotra@brightwave.io",
          avatarUrl: null,
          institution: "BrightWave Inc.",
          location: "Mumbai, India",
          profession: "Software Engineer",
          registrationDate: "12 Apr 2026",
        };

        const clicks = foundReferrer?.clicksCount ?? 1420;
        const registrations = foundReferrer?.registrationsCount ?? 89;
        const clicksRecent = foundReferrer?.clicksRecent ?? 15;
        const registrationsRecent = foundReferrer?.registrationsRecent ?? 3;

        return {
          referrer,
          opportunities: [
            {
              id: referralId,
              entityType: "COMMUNITY" as const,
              entityId: "community_1",
              entityName: "OppSkills Community",
              slug: "oppskills-community",
              image: null,
              dashboardUrl: "/dashboard",
              clicks,
              clicksLast24h: clicksRecent,
              registrations,
              registrationsLast24h: registrationsRecent,
              isActive: true,
            }
          ],
          summary: {
            totalReferrals: 1,
            totalClicks: clicks,
            clicksLast24h: clicksRecent,
            totalRegistrations: registrations,
            registrationsLast24h: registrationsRecent,
            activeLinks: 1,
          }
        };
      }
      return getReferrerDetails(await tokenOrThrow(getToken), referralId!);
    },
  });
}
