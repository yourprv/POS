export type Category = '1 PCS Set' | '2 PCS Set' | '3 PCS Set' | 'Others';
export type Location = string;
export type ShipmentStatus = 'IN_TRANSIT' | 'RECEIVED';
export type UserRole = 'admin' | 'salesperson';

export interface Product {
  id: string;
  code: string;
  name: string;
  category: Category;
  price: number;
  cost_price?: number;
  image_url: string;
  stock: number;
  status: 'Active' | 'Sold Out';
  location: Location;
  created_at: string;
}

export interface Sale {
  id: string;
  product_id: string;
  product_name: string;
  product_code: string;
  quantity: number;
  price_at_sale: number;
  discount?: number;
  sold_at: string;
  location: Location;
  sold_by: string;
}

export interface Shipment {
  id: string;
  product_id: string;
  product_name: string;
  product_code: string;
  quantity: number;
  from_location: Location;
  to_location: Location;
  status: ShipmentStatus;
  created_at: string;
  received_at?: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  name: string;
  location: Location;
}
