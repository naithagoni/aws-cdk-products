import { useCallback, useState } from "react";
import usersApi from "../services/usersApi";
import axios, { AxiosResponse } from "axios";

const useDeleteUser = (id: string) => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AxiosResponse>();
  const [error, setError] = useState<unknown>();

  const deleteUser = useCallback(async () => {
    if (!id) {
      console.error("No ID provided for deleteUser");
      return;
    }
    const cancelToken = axios.CancelToken.source();
    try {
      setLoading(true);
      const userRes = await usersApi.delete(`/${id}`, {
        cancelToken: cancelToken?.token,
      });
      setResponse(userRes);
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log("Request canceled:", err.message);
      } else {
        setError(err);
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
  }, [id]);

  return { deleteUser, loading, response, error };
};

export default useDeleteUser;
