import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class MoviesService {

  BASE_URL: string = "https://dcitmovieapi.herokuapp.com/";
  
  constructor(private http: HttpClient){

  }

  public getMovies(){
    return this.http.get(this.BASE_URL + 'api/movies');
  }
  public getMovie(id: any){
    return this.http.get(this.BASE_URL + `api/movies/${id}`);
  }
  public getCommentsForMovieWithId(id: any){
    return this.http.get(this.BASE_URL + `api/movies/${id}/comments`);
  }
  public createCommentForMovie(data: any){
    return this.http.post(this.BASE_URL + 'api/comments', data);
  }
  public deleteComment(id: any){
    return this.http.delete(this.BASE_URL + `api/comments/${id}`);
  }
}
