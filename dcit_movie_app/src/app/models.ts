export class Movie{
    gross?: string;
    id?: number;
    poster_url?: string;
    release_date?: string;
    studio?: string;
    title?: string;
}
export class Comment {
    public username!: string;
    public text!: string;
}
export interface APIResponse<T>{
    results: Array<T>;
}