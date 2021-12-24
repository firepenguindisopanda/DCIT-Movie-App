import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-all-movies',
  templateUrl: './all-movies.component.html',
  styleUrls: ['./all-movies.component.scss']
})
export class AllMoviesComponent implements OnInit {

  students: any[] = [{
      'name': 'Pokemon'
    }, {
      'name': 'Yu Gi Oh'
    }, {
      'name': 'Xaiolin Showdown'
    }, {
      'name': 'Courage The Cowardly Dog'
    }, {
      'name': 'Spiderman and Friends'
    }, {
      'name': 'Avatar the Last Airbender'
    }, {
      'name': 'Digimon'
    }, {
      'name': 'Kids Next Door'
    }, {
      'name': 'Invader Zim'
    },
    {
      'name': 'Pokemon'
    }, {
      'name': 'Yu Gi Oh'
    }, {
      'name': 'Xaiolin Showdown'
    }, {
      'name': 'Courage The Cowardly Dog'
    }, {
      'name': 'Spiderman and Friends'
    }, {
      'name': 'Avatar the Last Airbender'
    }, {
      'name': 'Digimon'
    }, {
      'name': 'Kids Next Door'
    }, {
      'name': 'Invader Zim'
    },
    {
      'name': 'Pokemon'
    }, {
      'name': 'Yu Gi Oh'
    }, {
      'name': 'Xaiolin Showdown'
    }, {
      'name': 'Courage The Cowardly Dog'
    }, {
      'name': 'Spiderman and Friends'
    }, {
      'name': 'Avatar the Last Airbender'
    }, {
      'name': 'Digimon'
    }, {
      'name': 'Kids Next Door'
    }, {
      'name': 'Invader Zim'
    }
  ];
  constructor() { }

  ngOnInit(): void {
  }

}
