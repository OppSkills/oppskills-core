export interface AdminUserDTO {
    id?: string;
    name: string;
    email: string;
    password: string;
    immutable?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}