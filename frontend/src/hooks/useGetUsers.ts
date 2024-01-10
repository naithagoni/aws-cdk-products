import { useEffect, useState } from "react";
import axios from "axios";
import { User } from "../types/user";

const useGetUsers = (url: string) => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const getUsers = async () => {
      try {
        const userList = await axios.get(url);
        console.log("RES: ", userList.data);
        setLoading(false);
        setUsers(userList.data);
      } catch (err) {}
    };

    getUsers();
  }, [url]);

  return { loading, users };
};

export default useGetUsers;
