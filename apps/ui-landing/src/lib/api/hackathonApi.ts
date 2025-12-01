import axios from 'axios';

const API = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL
})

export const getHackathons = async (token: string)=>{
const res = await API.get('/', {
    headers: {
        Authorization: `Bearer ${token}`,
    }
});
return res.data;
}

export const getHackathonById = async (token: string, id: string) => {
  const res = await API.get(`/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const createHackathon = async (token: string, data:any)=>{
    const res = await API.post('', data, {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    });
    return res.data
}

export const updateHackathon = async (token: string, id:string, data:any)=>{
    const res = await API.patch(`/${id}`, data, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    return res.data
}

export const deleteHackathon = async (token: string, id:string)=>{
    const res = await API.delete(`/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    });
    return res.data;
}

export const registerForHackathon = async (token: string, id:string)=>{
    const res = await API.post(`/${id}/register`,{},{
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    return res.data
}