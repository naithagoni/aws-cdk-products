import axios from "axios";

const usersApi = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}`,
});

axios.interceptors.request.use(
  (config) => {
    return config;
  },
  (err) => {
    return Promise.reject(err);
  }
);

axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (err) => {
    return Promise.reject(err);
  }
);

export default usersApi;
