export interface AdminUserDTO {
    id?: string;
    name: string;
    email: string;
    immutable?: boolean;
    isFirstLogin?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}