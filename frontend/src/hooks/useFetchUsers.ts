import { useEffect, useState } from "react";
import usersApi from "../services/usersApi";
import { User } from "../types/user";

const useFetchUsers = (url: string) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<unknown>(null);

  const fetchUsers = async (url: string) => {
    try {
      setLoading(true);
      const userList = await usersApi.get(url);
      console.log("RES: ", userList.data);
      setUsers(userList.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(url);
  }, [url]);

  return { loading, users, error };
};

export default useFetchUsers;
