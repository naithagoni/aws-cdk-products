import { useCallback, useState } from "react";
import usersApi from "../services/usersApi";
import axios, { AxiosError, AxiosResponse } from "axios";
import { AddUser } from "../types/user";

const useCreateUser = () => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AxiosResponse>();
  const [error, setError] = useState<AxiosError>();

  const createUser = useCallback(
    async (user: Record<string | number, string> | any) => {
      const cancelToken = axios.CancelToken.source();
      try {
        setLoading(true);
        const userReq: AddUser = {
          email: user.email,
          username: user.username,
          password: user.password,
          name: {
            firstname: user.firstname,
            lastname: user.lastname,
          },
          address: {
            street: user.street,
            zipcode: user.zipcode,
            city: user.city,
          },
          phone: user.phone,
        };
        const userRes = await usersApi.post("", userReq, {
          cancelToken: cancelToken?.token,
        });
        setResponse(userRes);
        return userRes.data;
      } catch (err) {
        if (axios.isCancel(err)) {
          console.log("Request canceled:", err.message);
        } else {
          setError(err as AxiosError);
        }
      } finally {
        setLoading(false);
      }

      // Clean up
      return () => {
        cancelToken.cancel(
          "Request canceled due to component unmount or new request"
        );
      };
    },
    []
  );

  return { createUser, loading, response, error };
};

export default useCreateUser;
