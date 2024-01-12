import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Slide from "@mui/material/Slide";
import { TransitionProps } from "@mui/material/transitions";
import { User } from "../../types/user";

type DialogProps = {
  data: User | null;
  open: boolean;
  handleClose: () => void;
  handleConfirm: () => void;
};

const DialogConfirm: React.FC<DialogProps> = ({
  data,
  open,
  handleClose,
  handleConfirm,
}) => {
  const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
      children: React.ReactElement<any, any>;
    },
    ref: React.Ref<unknown>
  ) {
    return <Slide direction="up" ref={ref} {...props} />;
  });

  return (
    <React.Fragment>
      <Dialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleConfirm}
        aria-describedby="alert-dialog-slide-description"
      >
        <DialogTitle>Are you sure you want to delete a user?</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-slide-description">
            User will be deleted forever and you won't be able to restore it.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button className="alert-dialog-no" onClick={handleClose}>
            No
          </Button>
          <Button className="alert-dialog-confirm" onClick={handleConfirm}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
};

export default DialogConfirm;
