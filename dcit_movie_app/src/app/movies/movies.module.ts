import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';

import { AllMoviesComponent } from './all-movies/all-movies.component';
import { MatCardModule } from '@angular/material/card';




@NgModule({
  declarations: [
    AllMoviesComponent
  ],
  imports: [
    CommonModule,
    MatListModule,
    MatCardModule
  ],
  exports: [
    AllMoviesComponent
  ]
})
export class MoviesModule { }
