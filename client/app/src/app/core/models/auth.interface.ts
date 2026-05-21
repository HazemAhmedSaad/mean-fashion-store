export interface AuthResponse {
    success: boolean;
    token: string;
} 
export interface JwtPayload {
    id?: string;
    name?: string;
    phone?: string;
    email?: string;
    role?: string;
    exp?: number;
}

export interface SignupRequest {
    name: string;
    phone: string;
    email?: string;
    password: string;
}

export interface LoginRequest {
    phone: string;
    password: string;
}