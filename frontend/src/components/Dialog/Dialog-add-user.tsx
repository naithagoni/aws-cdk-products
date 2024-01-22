import * as React from "react";
import Dialog from "@mui/material/Dialog";
import type { DialogProps } from "@mui/material";
import Slide from "@mui/material/Slide";
import { TransitionProps } from "@mui/material/transitions";
import DynamicForm from "../Form/Form";
import addUserSchema from "../../Schemas/add-user";
import "./Dialog-add-user.scss";

type DialogAddUserProps = {
  open: boolean;
};

const DialogAddUser: React.FC<DialogAddUserProps> = ({ open }) => {
  const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
      children: React.ReactElement<any, any>;
    },
    ref: React.Ref<unknown>
  ) {
    return <Slide direction="up" ref={ref} {...props} />;
  });

  const handleClose: DialogProps["onClose"] = (event, reason) => {
    if (reason && reason === "backdropClick") return;
  };

  return (
    <React.Fragment>
      <Dialog
        className="add-user-dialog"
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}
        disableEscapeKeyDown={true}
        aria-describedby="alert-dialog-slide-description"
      >
        <DynamicForm schema={addUserSchema} />
      </Dialog>
    </React.Fragment>
  );
};

export default DialogAddUser;
