import { Component, Input, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Comment } from '../../model';
import { MoviesService } from 'src/app/services/movies.service';

@Component({
  selector: 'app-view-movie-detail',
  templateUrl: './view-movie-detail.component.html',
  styleUrls: ['./view-movie-detail.component.scss']
})
export class ViewMovieDetailComponent implements OnInit {

  comment: Comment = {
    
    username: '',
    text: ''
  };
  comments: any = [];
  movieDetails: any = {};
  userId : number = 0;
  constructor(private movieService: MoviesService, private router: Router, private activatedRoute: ActivatedRoute) { }

  ngOnInit(): void {
    
    this.activatedRoute.params.subscribe(params => {
      this.userId = params["id"];
      this.getMovie(this.userId);
      this.getComments(this.userId);
    });

  }
  getMovie(id: number): void{
    this.movieService.getMovie(id).subscribe({
      next: (data) => {
        this.movieDetails = data;
      },
      error: (e) => console.error(e)
    });
  }
  getComments(id: number): void{
    this.movieService.getCommentsForMovieWithId(id).subscribe({
      next: (data) => {
        this.comments = data;
      },
      error: (e) => console.error(e)
    });
  }
  onSubmit(id: number, form: NgForm){
    
    console.log(form);
    
  }
  deleteComment(id: number, movie_id: number): void{
    
  }

}
