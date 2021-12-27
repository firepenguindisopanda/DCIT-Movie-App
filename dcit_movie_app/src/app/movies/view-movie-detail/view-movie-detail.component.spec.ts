import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule, Routes } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AllMoviesComponent } from '../all-movies/all-movies.component';
import { ViewMovieDetailComponent } from './view-movie-detail.component';
import { NgForm } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from 'src/app/app-routing.module';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LayoutModule } from 'src/app/layout/layout.module';
import { MoviesModule } from '../movies.module';

describe('ViewMovieDetailComponent', () => {
  let component: ViewMovieDetailComponent;
  let fixture: ComponentFixture<ViewMovieDetailComponent>;
  const routes: Routes = [
    { path: '', component: AllMoviesComponent },
  
    { path: '', 
      children: [
        { path: 'movies', component: AllMoviesComponent },
        { path: 'details/:id', component: ViewMovieDetailComponent },
      ]
    }
  ]
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewMovieDetailComponent],
      imports: [
        HttpClientModule,
        RouterModule,
        RouterTestingModule,
        RouterModule.forRoot(routes),
        BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        MatSidenavModule,
        LayoutModule,
        MoviesModule,
        MatCardModule,
        MatIconModule,
        MatToolbarModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatListModule,
        MatGridListModule
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewMovieDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});


