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
export interface Game{
    id: string;
    background_image: string;
    name: string;
    released: string;
    metacritic_url: string;
    website: string;
    description: string;
    metacritic: number;
    genres: Array<Genre>;
    parent_platforms: Array<ParentPlatforms>;
    publishers: Array<Publishers>;
    ratings: Array<Rating>;
    screenshots: Array<Screenshots>;
    trailers: Array<Trailer>;

}
interface Genre{
    name: string;
}
interface ParentPlatforms{
    platform: {
        name: string;
    }
}
interface Publishers{
    name: string;

}
interface Rating{
    id: number;
    count: number;
    title: string;
}
interface Screenshots{
    image: string;
}
interface Trailer{
    data: {
        max: string;
    };
}