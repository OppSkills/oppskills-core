import axios from 'axios';

const API = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL
})

export const createTeam = async(token: string, data: any)=>{
    const res = await API.post('/create-team', data, {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    });
    return res.data;
}

 export const joinTeam = async(token: string, data: any) =>{
        const res = await API.post('/join-team', data, {
            headers: {
                Authorization: `Bearer ${token}`
            },
        });
        return res.data
    }

    export const leaveTeam = async (token: string, teamId: string)=>{
        const res = await API.delete(`/leave-team/${teamId}`,{
            headers:
            {
                Authorization: `Bearer ${token}`
            }
        })
        return res.data;
    }


   export const getTeamsByHackathon = async (token: string, hackathonId: string) => {
  const res = await API.get(`/teams/${hackathonId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const getTeamById = async (token: string, teamId: string) => {
  const res = await API.get(`/team/${teamId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};