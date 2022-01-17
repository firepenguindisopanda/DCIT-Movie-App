import { Component, OnInit, EventEmitter, Input, Output, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatFormFieldControl } from '@angular/material/form-field';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { map, startWith } from 'rxjs/operators';
import { APIResponse, Game } from 'src/app/model';
import { User } from 'src/app/models';
import { HttpService } from 'src/app/services/http.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.sass']
})
export class HomeComponent implements OnInit, OnDestroy {
  public sort: string = '';
  public games: Array<Game> = [];
  private routeSub!: Subscription;
  private gameSub!: Subscription;
  myControl = new FormControl();
  options: string[] = ['One', 'Two', 'Three'];
  filteredOptions!: Observable<Game[]>;
  getNamesFromGames: Array<string> = [];
  constructor(private router: Router, private httpService: HttpService, private activatedRoute: ActivatedRoute) {
    
  }

  ngOnInit(): void {
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => (typeof value === 'string' ? value : value.name)),
      map(name => (name ? this._filter(name) : this.games.slice())),
    );
    this.routeSub = this.activatedRoute.params.subscribe((params: Params) => {
      if(params['game-search']){
        this.searchGames('metacrit', params['game-search']);
      } else {
        this.searchGames('metacrit');
      }
    });
    this.games.forEach((value) => {
      this.getNamesFromGames.push(value.name);
    });
    
  }
  displayFn(game: Game): string{
    return game && game.name ? game.name : '';
  }
  private _filter(value: string): Game[]{
    const filterValue = value.toLowerCase();
    return this.games.filter(option => option.name.toLowerCase().includes(filterValue));
  }

  searchGames(sort: string, search?: string): void{
    this.gameSub = this.httpService.getGameList(sort, search).subscribe((gameList: APIResponse<Game>) => {
      this.games = gameList.results;
      console.log(gameList);
    });
  }
  
  openGameDetails(id: string): void{
    this.router.navigate(['details', id]);
  }
  ngOnDestroy(): void {
    if(this.gameSub){
      this.gameSub.unsubscribe();
    }
    if(this.routeSub){
      this.routeSub.unsubscribe();
    }
  }

}
