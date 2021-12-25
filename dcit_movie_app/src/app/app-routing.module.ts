import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AllMoviesComponent } from './movies/all-movies/all-movies.component';
import { ViewMovieDetailComponent } from './movies/view-movie-detail/view-movie-detail.component';


const routes: Routes = [
  { path: '', component: AllMoviesComponent },
  
  { path: '', 
    children: [
      { path: 'movies/', component: AllMoviesComponent },
      { path: 'details/:id', component: ViewMovieDetailComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
