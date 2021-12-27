import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AppRoutingModule } from 'src/app/app-routing.module';
import { LayoutModule } from 'src/app/layout/layout.module';
import { MoviesModule } from '../movies.module';
import { ViewMovieDetailComponent } from '../view-movie-detail/view-movie-detail.component';

import { AllMoviesComponent } from './all-movies.component';

describe('AllMoviesComponent', () => {
  let component: AllMoviesComponent;
  let fixture: ComponentFixture<AllMoviesComponent>;
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
      declarations: [ AllMoviesComponent ],
      imports: [
        RouterModule,
        RouterTestingModule,
        RouterModule.forRoot(routes),
        HttpClientModule,
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
    fixture = TestBed.createComponent(AllMoviesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
