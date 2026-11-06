export interface Role {
  id: number;
  name: string;
  label: string;

  roles?: {
    id: number;
    name: string;
  }[];
}
