import { Component, OnInit } from '@angular/core';
import { MoviesService } from 'src/app/services/movies.service';

@Component({
  selector: 'app-all-movies',
  templateUrl: './all-movies.component.html',
  styleUrls: ['./all-movies.component.scss']
})
export class AllMoviesComponent implements OnInit {

  movieList: any = [];
  listMovies$:  any;
  
  constructor(private moviesService: MoviesService) { }

  ngOnInit(): void {
    this.retrieveMovies();
    this.retrieveMoviesUsingObservable();
  }
  retrieveMovies(): void{
    this.moviesService.getMovies().subscribe({
      next: (data) => {
        this.movieList = data;
      },
      error: (e) => console.error(e)
    });
    
  }

  retrieveMoviesUsingObservable(): void{
    this.moviesService.getMovies().subscribe(data => {
      this.listMovies$ = data;
    })
  }

}
