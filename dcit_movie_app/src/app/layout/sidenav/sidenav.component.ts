import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class SidenavComponent implements OnInit {

  students: any[] = [{
    'name': 'Pokemon',
    'id': 1
  }, {
    'name': 'Yu Gi Oh',
    'id': 2
  }, {
    'name': 'Xaiolin Showdown',
    'id': 3
  }, {
    'name': 'Courage The Cowardly Dog',
    'id': 4
  }, {
    'name': 'Spiderman and Friends',
    'id': 5
  }, {
    'name': 'Avatar the Last Airbender',
    'id': 6
  }, {
    'name': 'Digimon',
    'id': 7
  }, {
    'name': 'Kids Next Door',
    'id': 8
  }, {
    'name': 'Invader Zim',
    'id': 9
  },
  {
    'name': 'Pokemon',
    'id': 10
  }, {
    'name': 'Yu Gi Oh',
    'id': 11
  }, {
    'name': 'Xaiolin Showdown',
    'id': 12
  }, {
    'name': 'Courage The Cowardly Dog',
    'id': 13
  }, {
    'name': 'Spiderman and Friends',
    'id': 14
  }, {
    'name': 'Avatar the Last Airbender',
    'id': 15
  }, {
    'name': 'Digimon',
    'id': 16
  }, {
    'name': 'Kids Next Door',
    'id': 17
  }, {
    'name': 'Invader Zim',
    'id': 18
  },
  {
    'name': 'Pokemon',
    'id': 19
  }, {
    'name': 'Yu Gi Oh',
    'id': 20
  }, {
    'name': 'Xaiolin Showdown',
    'id': 21
  }, {
    'name': 'Courage The Cowardly Dog',
    'id': 22
  }, {
    'name': 'Spiderman and Friends',
    'id': 23
  }, {
    'name': 'Avatar the Last Airbender',
    'id': 24
  }, {
    'name': 'Digimon',
    'id': 25
  }, {
    'name': 'Kids Next Door',
    'id': 26
  }, {
    'name': 'Invader Zim',
    'id': 27
  }
];
  constructor() { }

  ngOnInit(): void {
  }

}
