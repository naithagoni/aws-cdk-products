export type User = {
  itemId: string;
  email: string;
  username: string;
  password: string;
  name: Fullname;
  address: Address;
  phone: string;
  actions?: unknown;
};

type Fullname = {
  firstname: string;
  lastname: string;
};

type Address = {
  street: string;
  zipcode: string;
  city: string;
};
