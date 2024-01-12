import React, { useCallback, useMemo } from "react";
import { Column, Row, useTable } from "react-table";
import IconButton from "@mui/material/IconButton";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DialogConfirm from "../Dialog/Dialog-confirm";
import { User } from "../../types/user";
import "./Table.scss";

type TableProps = {
  data: User[];
};

const Table: React.FC<TableProps> = ({ data }) => {
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);

  const handleEdit = useCallback(
    (row: Row<User>) => {
      console.log("Edit clicked for row:", row.original);
      setSelectedUser(row.original);
      setIsEditDialogOpen(!isEditDialogOpen);
    },
    [isEditDialogOpen]
  );

  const handleDelete = useCallback(
    (row: Row<User>) => {
      console.log("Delete clicked for row:", row.original);
      setSelectedUser(row.original);
      setIsConfirmDialogOpen(!isConfirmDialogOpen);
    },
    [isConfirmDialogOpen]
  );

  const columns: Column<User>[] = useMemo(
    () => [
      { Header: "ID", accessor: (row: User) => row.id.toString() },
      { Header: "First Name", accessor: (row: User) => row.name.firstname },
      { Header: "Last Name", accessor: (row: User) => row.name.lastname },
      { Header: "Email", accessor: "email" },
      { Header: "Phone", accessor: "phone" },
      { Header: "Street", accessor: (row: User) => row.address.street },
      { Header: "City", accessor: (row: User) => row.address.city },
      {
        Header: "",
        accessor: "actions",
        Cell: ({ row }: { row: Row<User> }) => (
          <>
            <IconButton
              className="edit"
              style={{ marginRight: "5px" }}
              onClick={() => handleEdit(row)}
              disabled={true}
            >
              <EditOutlinedIcon />
            </IconButton>
            <IconButton className="delete" onClick={() => handleDelete(row)}>
              <DeleteForeverRoundedIcon />
            </IconButton>
          </>
        ),
      },
    ],
    [handleEdit, handleDelete]
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({ columns, data });

  // Check if there's data
  if (!data || data.length === 0) return <p>No data available</p>;

  return (
    <React.Fragment>
      <div className="table-container">
        <h1>Users List</h1>
        <table {...getTableProps()}>
          <thead>
            {headerGroups.map((headerGroup) => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column) => (
                  <th {...column.getHeaderProps()}>
                    {column.render("Header")}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.map((row) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map((cell) => (
                    <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        {isEditDialogOpen && <p>Edit Dialog box</p>}
        {isConfirmDialogOpen && (
          <DialogConfirm
            open={isConfirmDialogOpen}
            data={selectedUser}
            handleClose={() => {
              setSelectedUser(null);
              setIsConfirmDialogOpen(false);
            }}
            handleConfirm={() => {
              console.log("Dialog closed. Additional logic or state reset.");
              // Reset selectedUser
              setSelectedUser(null);
              setIsConfirmDialogOpen(false);
            }}
          />
        )}
      </div>
    </React.Fragment>
  );
};

export default Table;
