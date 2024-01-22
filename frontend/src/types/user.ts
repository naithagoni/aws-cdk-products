export type User = {
  id: number;
  email: string;
  username: string;
  password: string;
  name: Fullname;
  address: Address;
  phone: string;
  actions?: unknown;
};

export type AddUser = {
  email: string;
  username: string;
  password: string;
  name: Fullname;
  address: Address;
  phone: string;
};

type Fullname = {
  firstname: string;
  lastname: string;
};

type Address = {
  city: string;
  street: string;
  zipcode: string;
};
