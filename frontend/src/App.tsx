import Table from "./components/Table/Table";
import useFetchUsers from "./hooks/useFetchUsers";
import "./App.scss";

const App = () => {
  const { loading, users, error } = useFetchUsers("/users");

  if (loading) return <h3>Loading...</h3>;
  if (error) return <h3>Error: error?.message</h3>;

  return <div className="App">{users && <Table data={users} />}</div>;
};

export default App;
