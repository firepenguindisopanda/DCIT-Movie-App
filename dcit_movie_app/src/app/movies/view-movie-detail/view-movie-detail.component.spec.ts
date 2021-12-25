import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewMovieDetailComponent } from './view-movie-detail.component';

describe('ViewMovieDetailComponent', () => {
  let component: ViewMovieDetailComponent;
  let fixture: ComponentFixture<ViewMovieDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewMovieDetailComponent ]
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
