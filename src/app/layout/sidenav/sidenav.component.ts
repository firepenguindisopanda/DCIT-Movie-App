import { Component, OnInit } from '@angular/core';
import { MoviesService } from 'src/app/services/movies.service';

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class SidenavComponent implements OnInit {

movieList: any = [];
  
constructor(private moviesService: MoviesService) { }

ngOnInit(): void {
  this.retrieveMovies();
}
retrieveMovies(): void{
  this.moviesService.getMovies().subscribe({
    next: (data) => {
      this.movieList = data;
    },
    error: (e) => console.error(e)
  });
  
}

}
