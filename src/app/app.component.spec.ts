import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { RouterModule, Routes } from '@angular/router';
import { AllMoviesComponent } from './movies/all-movies/all-movies.component';
import { ViewMovieDetailComponent } from './movies/view-movie-detail/view-movie-detail.component';
import { LayoutModule } from './layout/layout.module';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
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
import { AppRoutingModule } from './app-routing.module';
import { MoviesModule } from './movies/movies.module';



describe('AppComponent', () => {
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
      declarations: [
        AppComponent
      ],
      imports: [
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
        MatGridListModule,
        HttpClientModule
      ],
      providers: []
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
  it(`should have as title 'DcitMovieApp'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('dcit_movie_app');
  })
});
