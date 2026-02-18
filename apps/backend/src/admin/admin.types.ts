export interface AdminUserDTO {
    id?: string;
    name: string;
    email: string;
    immutable?: boolean;
    isFirstTime?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}