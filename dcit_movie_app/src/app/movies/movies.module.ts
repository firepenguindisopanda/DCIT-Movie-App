import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';

import { AllMoviesComponent } from './all-movies/all-movies.component';




@NgModule({
  declarations: [
    AllMoviesComponent
  ],
  imports: [
    CommonModule,
    MatListModule
  ],
  exports: [
    AllMoviesComponent
  ]
})
export class MoviesModule { }
