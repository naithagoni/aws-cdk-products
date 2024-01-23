const addUserSchema = {
  email: {
    label: "Email",
    type: "email",
    placeholder: "Enter your Email",
    required: true,
    validation: {
      required: "Email is required",
      pattern: {
        value: /^\S+@\S+$/i,
        message: "Invalid email address",
      },
    },
  },
  username: {
    label: "Username",
    type: "text",
    placeholder: "Enter your Username",
    required: true,
    validation: {
      required: "Username is required",
    },
  },
  password: {
    label: "Password",
    type: "password",
    placeholder: "Enter your Password",
    required: true,
    validation: {
      required: "Password is required",
      minLength: {
        value: 5,
        message: "Password should have at least 5 characters",
      },
    },
  },
  firstname: {
    label: "First Name",
    type: "text",
    placeholder: "Enter your First Name",
    required: true,
    validation: {
      required: "First Name is required",
      minLength: {
        value: 3,
        message: "First Name should have at least 3 characters",
      },
    },
  },
  lastname: {
    label: "Last Name",
    type: "text",
    placeholder: "Enter your Last Name",
    required: true,
    validation: {
      required: "Last Name is required",
    },
  },
  street: {
    label: "Street Name",
    type: "text",
    placeholder: "Enter your Street Name",
    required: true,
    validation: {
      required: "Street Name is required",
    },
  },
  zipcode: {
    label: "Zip Code",
    type: "number",
    placeholder: "Enter your Zip Code",
    required: true,
    validation: {
      required: "Zip Code is required",
      minLength: {
        value: 6,
        message: "Zip Code should have at least 6 characters",
      },
      maxLength: {
        value: 6,
        message: "Zip Code should not exceed 6 characters",
      },
    },
  },
  city: {
    label: "City",
    type: "text",
    placeholder: "Enter your City",
    required: false,
  },
  phone: {
    label: "Phone",
    type: "number",
    placeholder: "Enter your Phone number",
    required: true,
    validation: {
      required: "Phone number is required",
      minLength: {
        value: 10,
        message: "Phone number should have at least 10 characters",
      },
      maxLength: {
        value: 11,
        message: "Phone number should not exceed 11 characters",
      },
    },
  },
};

export default addUserSchema;
