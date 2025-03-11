export interface UpdateEnvironmentDTO {
    name?: string;
    status?: 'active' | 'archived' | 'deleted';
}