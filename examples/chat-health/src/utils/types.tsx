export type MenuItem = {
  item: string;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
};

export type Menu = {
  items: MenuItem[];
  size: string;
};
