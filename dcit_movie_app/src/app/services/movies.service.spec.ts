import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { async, inject, TestBed } from '@angular/core/testing';

import { MoviesService } from './movies.service';

describe('MoviesService', () => {
  let moviesService: MoviesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports:[
        HttpClientModule,
        HttpClientTestingModule
      ],
      providers: [
        MoviesService
      ]
    });
    moviesService = TestBed.inject(MoviesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(moviesService).toBeTruthy();
  });

  it(`should fetch movie with ID 1`, async(inject([HttpTestingController, MoviesService], (httpClient: HttpTestingController, moviesService: MoviesService) => {
    const movieItem = [
      {
        gross: "$714,766,572.00",
    id: 1,
    poster_url: "https://resizing.flixster.com/gxRJwetP1eNIrPR6xlWBfD_VaFc=/180x267/dkpu1ddg7pbsk.cloudfront.net/movie/11/17/72/11177246_ori.jpg",
    release_date: "04-Apr-14",
    studio: "Marvel Studios",
    title: "Captain America: The Winter Soldier"
      }
    ]
    moviesService.getMovie(1).subscribe((movies: any) => {
      expect(movies.length).toBe(1);
    });

    let req = httpMock.expectOne('https://dcitmovieapi.herokuapp.com/api/movies/1');
    expect(req.request.method).toBe("GET");
    req.flush(movieItem);
    httpMock.verify();


  })));

});
