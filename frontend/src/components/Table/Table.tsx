import React, { useCallback, useMemo, useState } from "react";
import { Column, Row, useTable } from "react-table";

import IconButton from "@mui/material/IconButton";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

import DialogConfirm from "../Dialog/Dialog-confirm";
import DialogAddUser from "../Dialog/Dialog-add-user";
import { User } from "../../types/user";

import useDeleteUser from "../../hooks/useDeleteUser";
import useCreateUser from "../../hooks/useCreateUser";

import "./Table.scss";

type TableProps = {
  data: User[];
  onDeleteUser: (id: string) => void;
  onAddUser: (newUser: User) => void;
};

const Table: React.FC<TableProps> = ({ data, onDeleteUser, onAddUser }) => {
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { deleteUser } = useDeleteUser(selectedUser?.itemId + "");
  const { createUser } = useCreateUser();

  const handleConfirmDelete = async () => {
    if (selectedUser) {
      setIsConfirmDialogOpen(false);
      try {
        await deleteUser();
        onDeleteUser(selectedUser.itemId);
      } catch (error) {
        console.error("Error deleting user:", error);
      } finally {
        setSelectedUser(null);
      }
    }
  };

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
      setSelectedUser(row.original);
      setIsConfirmDialogOpen(!isConfirmDialogOpen);
    },
    [isConfirmDialogOpen]
  );

  const handleAddUser = useCallback(() => {
    setIsAddUserDialogOpen(!isAddUserDialogOpen);
  }, [isAddUserDialogOpen]);

  const handleFormSubmit = async (
    fData: Record<string | number, string> | any
  ) => {
    setIsAddUserDialogOpen(false);
    try {
      const res = await createUser(fData);
      const newUser: User = {
        itemId: res.itemId,
        email: fData.email,
        username: fData.username,
        password: fData.password,
        name: {
          firstname: fData.firstname,
          lastname: fData.lastname,
        },
        address: {
          street: fData.street,
          zipcode: fData.zipcode,
          city: fData.city,
        },
        phone: fData.phone,
      };
      console.log("NEW USER", newUser);
      if (newUser) {
        onAddUser(newUser);
      }
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  const columns: Column<User>[] = useMemo(
    () => [
      { Header: "ID", accessor: (row: User) => row.itemId },
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
              className="edit-user-button"
              style={{ marginRight: "5px" }}
              onClick={() => handleEdit(row)}
              disabled={true}
            >
              <EditOutlinedIcon />
            </IconButton>
            <IconButton
              className="delete-user-button"
              onClick={() => handleDelete(row)}
            >
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

  return (
    <React.Fragment>
      <div className="add-user-button-container">
        <IconButton className="add-user-button" onClick={() => handleAddUser()}>
          <AddCircleOutlineIcon />
        </IconButton>
        {isAddUserDialogOpen && (
          <DialogAddUser
            open={isAddUserDialogOpen}
            onFormSubmit={handleFormSubmit}
          />
        )}
      </div>

      {data && data.length === 0 && <p>No data available</p>}

      {data.length > 0 && (
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
              handleConfirm={handleConfirmDelete}
            />
          )}
        </div>
      )}
    </React.Fragment>
  );
};

export default Table;
