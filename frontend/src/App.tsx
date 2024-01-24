import { useEffect, useState } from "react";
import Table from "./components/Table/Table";
import useFetchUsers from "./hooks/useFetchUsers";
import { User } from "./types/user";
import "./App.scss";

const App = () => {
  const { loading, users, error } = useFetchUsers();
  const [tableData, setTableData] = useState<User[]>([]);

  useEffect(() => {
    if (users) {
      setTableData(users);
    }
  }, [users]);

  const handleDeleteUser = (deletedUserId: string) => {
    // Update the table data by filtering out the deleted user
    const updatedData = tableData.filter(
      (user) => user.itemId !== deletedUserId
    );
    setTableData(updatedData);
  };

  const handleAddNewUser = (newUser: User) => {
    setTableData((prevUsers) => [...prevUsers, newUser]);
  };

  if (loading) return <h3>Loading...</h3>;
  if (error) return <h3>Error: {error?.message}</h3>;

  return (
    <div className="App">
      {users && (
        <Table
          data={tableData}
          onDeleteUser={handleDeleteUser}
          onAddUser={handleAddNewUser}
        />
      )}
    </div>
  );
};

export default App;
