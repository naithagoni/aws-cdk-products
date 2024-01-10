import Table from "./components/Table/Table";
import useGetUsers from "./hooks/useGetUsers";
import DialogBox from "./components/Dialog/Dialog";
import "./App.scss";

const App = () => {
  const { loading, users } = useGetUsers(
    `${process.env.REACT_APP_API_URL}/users`
  );

  if (loading) return <h3>Loading...</h3>;

  return (
    <div className="App">
      <Table data={users} />
      <DialogBox />
    </div>
  );
};

export default App;
