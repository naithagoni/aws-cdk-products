import { useEffect, useState, useCallback } from "react";
import axios, { CancelTokenSource } from "axios";
import usersApi from "../services/usersApi";
import { User } from "../types/user";

const useFetchUsers = (id?: string, params?: string) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<unknown>(null);

  const constructUrl = useCallback(() => {
    const url = id ? `/${id}` : "";
    const queryParams = params ? `?${params}` : "";
    return `${url}${queryParams}`;
  }, [id, params]);

  const fetchUsers = useCallback(
    async (cancelToken: CancelTokenSource) => {
      try {
        setLoading(true);
        const userList = await usersApi.get(constructUrl(), {
          cancelToken: cancelToken.token,
        });
        setUsers(userList.data);
      } catch (err) {
        if (axios.isCancel(err)) {
          console.log("Request canceled:", err.message);
        } else {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    },
    [constructUrl]
  );

  useEffect(() => {
    const cancelToken = axios.CancelToken.source();
    fetchUsers(cancelToken);

    return () => {
      cancelToken.cancel(
        "Request canceled due to component unmount or new request"
      );
    };
  }, [fetchUsers]);

  return { loading, users, error };
};

export default useFetchUsers;
