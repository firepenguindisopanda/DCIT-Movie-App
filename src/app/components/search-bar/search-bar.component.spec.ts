import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchBarComponent } from './search-bar.component';

describe('SearchBarComponent', () => {
  let component: SearchBarComponent;
  let fixture: ComponentFixture<SearchBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SearchBarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it(`should render 'a search button goes here'`, () => {
    fixture = TestBed.createComponent(SearchBarComponent);
    fixture.detectChanges();

    const app = fixture.debugElement.nativeElement;
    expect(app.querySelector('span').textContent).toContain('a logo goes here');
    
  });
  it(`should render 'What To Watch?'`, () => {
    fixture = TestBed.createComponent(SearchBarComponent);
    fixture.detectChanges();
    const app = fixture.debugElement.nativeElement;
    expect(app.querySelector('button').textContent).toContain('Search');
  })
});
