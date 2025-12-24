import { API_URL } from "./apiurl";

export const getdata = async () => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/auth/me`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`, // Key part: send token here
    'Content-Type': 'application/json'
  }
});
const userdata = await response.json();
// console.log(userdata); 
 
return userdata;
}