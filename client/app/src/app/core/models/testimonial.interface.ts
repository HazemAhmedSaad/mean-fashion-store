import { Pagination } from "./pagination.interface"

export interface TestimonialsResponse {
    success: boolean
    results: number
    pagination: Pagination
    data: Testimonial[]
}


export interface Testimonial {
    _id: string;
    name: string;
    phone: string;
    comment: string;
    stars: number;
    avatar?: string;
    status: 'pending' | 'approved' | 'rejected';
    isVisible: boolean;
}

export interface singleTestimonialResponse {
    success: boolean
    data: Testimonial
}export interface CreateTestimonialRequest {
    name: string;
    phone: string;
    comment: string;
    stars?: number;
}

export interface UpdateTestimonialRequest {
    status?: 'pending' | 'approved' | 'rejected';
    isVisible?: boolean;
}