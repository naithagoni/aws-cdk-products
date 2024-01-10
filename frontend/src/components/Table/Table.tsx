import React, { useMemo } from "react";
import { Column, Row, useTable } from "react-table";
import IconButton from "@mui/material/IconButton";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { User } from "../../types/user";
import "./Table.scss";

type TableProps = {
  data: User[];
};

const Table: React.FC<TableProps> = ({ data }) => {
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
    []
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({ columns, data });

  const handleEdit = (row: any) => {
    console.log("Edit clicked for row:", row.original);
  };

  const handleDelete = (row: any) => {
    console.log("Delete clicked for row:", row.original);
  };

  // Check if there's data
  if (!data || data.length === 0) return <p>No data available</p>;

  return (
    <div className="table-container">
      <h1>Users List</h1>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()}>{column.render("Header")}</th>
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
    </div>
  );
};

export default Table;
