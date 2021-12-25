import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { AllMoviesComponent } from './all-movies/all-movies.component';
import { MatCardModule } from '@angular/material/card';
import { ViewMovieDetailComponent } from './view-movie-detail/view-movie-detail.component';
import { MatFormFieldModule, MAT_FORM_FIELD, MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';


@NgModule({
  declarations: [
    AllMoviesComponent,
    ViewMovieDetailComponent
  ],
  imports: [
    CommonModule,
    MatListModule,
    MatCardModule,
    MatFormFieldModule,
    FormsModule,
    MatGridListModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule
  ],
  exports: [
    AllMoviesComponent,
    ViewMovieDetailComponent
  ]
})
export class MoviesModule { }
