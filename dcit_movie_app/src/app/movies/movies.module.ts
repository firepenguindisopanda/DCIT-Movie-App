import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AllMoviesComponent } from './all-movies/all-movies.component';



@NgModule({
  declarations: [
    AllMoviesComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    AllMoviesComponent
  ]
})
export class MoviesModule { }
