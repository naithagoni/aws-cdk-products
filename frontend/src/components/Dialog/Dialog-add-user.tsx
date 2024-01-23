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
  onFormSubmit: (formData: Record<string | number, string>) => void;
};

const DialogAddUser: React.FC<DialogAddUserProps> = ({
  open,
  onFormSubmit,
}) => {
  const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
      children: React.ReactElement<any, any>;
    },
    ref: React.Ref<unknown>
  ) {
    return <Slide direction="up" ref={ref} {...props} />;
  });

  // Prevent closing a dialog on back drop click
  const handleClose: DialogProps["onClose"] = (event, reason) => {
    if (reason && reason === "backdropClick") return;
  };

  const handleFormSubmit = (formData: Record<string | number, string>) => {
    onFormSubmit(formData);
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
        <DynamicForm schema={addUserSchema} onFormSubmit={handleFormSubmit} />
      </Dialog>
    </React.Fragment>
  );
};

export default DialogAddUser;
